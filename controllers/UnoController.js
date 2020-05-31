const _ = require('lodash');

const mongodb = require('../model/mongodb');
const { serverError, responses } = require('../utils/ResponseUtil');
const GameUtil = require('../utils/GameUtil');
const UnoUtil = require('../utils/UnoUtil');

const GAME_NAME = "uno";
const cards = UnoUtil.getCards();

class UnoController {

    static async start(req, res) {
        try {
            let { gameData, player } = req;
            const deck = GameUtil.shuffle(cards, { 'copy': true });
            let lastCard = null;
            while (!lastCard) {
                const num = _.random(0, deck.length - 1);
                const card = deck[num];
                if (card.type.match(/[0-9]/) == null) continue;
                lastCard = card;
                deck.splice(num, 1);
            }
            let playersCards = {}, playersInGame = GameUtil.shuffle(gameData.players, { 'copy': true });
            for (let i = 0; i < playersInGame.length; i++) {
                const playerId = playersInGame[i]._id;
                playersCards[playerId] = [];
                for (let j = 0; j < 7; j++) {
                    const num = _.random(0, deck.length - 1);
                    const card = deck[num];
                    playersCards[playerId].push(card);
                    deck.splice(num, 1);
                }
            }
            const $setObj = {
                playersInGame, status: 'STARTED', lastCard, playersCards, deck,
                startedBy: player, startedAt: new Date(),
                currentPlayer: playersInGame[0], inc: 1,
                updatedAt: new Date(), updatedBy: player
            };
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            const respObj = GameUtil.pickGamePublicFields(GAME_NAME, { ...$setObj, players: gameData.players }, player);
            res.json(respObj);
            io.emit(req.roomId, { event: 'GAME_STARTED', gameData: _.pick(respObj, 'updatedBy') });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async submit(req, res) {
        try {
            let { gameData, player, cardIndex } = req;
            const { chosenCard } = req.body;
            let inc = gameData.inc;
            if (chosenCard.type == UnoUtil.card_types.REVERSE_CARD) {
                inc = -inc;
            }
            let nextPlayer = GameUtil.getNextPlayer(gameData.players, gameData.currentPlayer, inc);
            switch (chosenCard.type) {
                case UnoUtil.card_types.WILD_CARD_DRAW_FOUR_CARDS:
                    gameData.playersCards[nextPlayer._id] = gameData.playersCards[nextPlayer._id].concat(gameData.deck.splice(0, 2));
                case UnoUtil.card_types.DRAW_TWO_CARDS:
                    gameData.playersCards[nextPlayer._id] = gameData.playersCards[nextPlayer._id].concat(gameData.deck.splice(0, 2));
                case UnoUtil.card_types.SKIP_CARD:
                    nextPlayer = GameUtil.getNextPlayer(gameData.players, nextPlayer, inc);
                    break;
            }
            gameData.deck.splice(_.random(0, gameData.deck.length - 1), 0, gameData.lastCard);
            gameData.playersCards[player._id].splice(cardIndex, 1);
            let $setObj = {
                lastLastCard: gameData.lastCard, lastCard: chosenCard, playersCards: gameData.playersCards, inc: inc,
                currentPlayer: nextPlayer, deck: gameData.deck,
                updatedAt: new Date(), updatedBy: player
            };
            switch (gameData.playersCards[player._id].length) {
                case 0:
                    $setObj.status = 'ENDED';
                    break;
                case 1:
                    if (req.body.isUnoClicked != 'true') {
                        $setObj.playersCards[player._id] = $setObj.playersCards[player._id].concat($setObj.deck.splice(0, 2));
                    }
                    break;
            }
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            const respObj = GameUtil.pickGamePublicFields(GAME_NAME, { ...$setObj, players: gameData.players }, player);
            res.json(respObj);
            io.emit(req.roomId, { event: 'PLAYER_SUBMITTED_CARD', gameData: _.omit(respObj, 'myCards') });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async pass(req, res) {
        try {
            let { gameData, player } = req;
            if (gameData.currentPlayer.pass != true) {
                return res.status(400).json(responses.PLAYER_CANT_PASS);
            }
            let $setObj = {
                currentPlayer: GameUtil.getNextPlayer(gameData.players, gameData.currentPlayer, gameData.inc),
                updatedAt: new Date(), updatedBy: player
            };
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            res.json($setObj);
            io.emit(req.roomId, { event: 'PLAYER_PASSED', gameData: $setObj });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async take(req, res) {
        try {
            let { gameData, player } = req;
            if (gameData.currentPlayer.pass) {
                return res.status(400).json(responses.PLAYER_TOOK_CARD_ALREADY);
            }
            gameData.currentPlayer.pass = true;
            let $setObj = {
                playersCards: gameData.playersCards,
                currentPlayer: gameData.currentPlayer,
                deck: gameData.deck,
                updatedAt: new Date(), updatedBy: player
            };
            $setObj.playersCards[player._id].push(gameData.deck[0]);
            $setObj.deck.splice(0, 1);
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            const respObj = GameUtil.pickGamePublicFields(GAME_NAME, { ...$setObj, players: gameData.players }, player);
            res.json(respObj);
            io.emit(req.roomId, { event: 'PLAYER_SUBMITTED_CARD', gameData: _.omit(respObj, 'myCards') });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async leave(req, res) {
        try {
            let { gameData, player, playerIndex } = req;
            gameData.players.splice(playerIndex, 1);
            let $setObj = {
                players: gameData.players,
                updatedAt: new Date(), updatedBy: player
            };
            if ($setObj.players.length && gameData.admin._id == player._id) {
                $setObj.admin = $setObj.players[_.random(0, $setObj.players.length - 1)];
            }
            if (gameData.status == 'STARTED') {
                if ($setObj.players.length == 1) {
                    $setObj.status = 'ENDED';
                } else {
                    gameData.playersCards[player._id].forEach(card => {
                        gameData.deck.splice(_.random(0, gameData.deck.length - 1), 0, card);
                    });
                    $setObj.deck = gameData.deck;
                    if (gameData.currentPlayer._id == player._id) {
                        $setObj.currentPlayer = $setObj.players[playerIndex == $setObj.players.length ? 0 : playerIndex];
                    }
                }
            }
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            res.sendStatus(200);
            io.emit(req.roomId, {
                event: 'PLAYER_LEFT_ROOM',
                gameData: { leftPlayerIndex: playerIndex, ..._.pick($setObj, 'updatedBy') }
            });
        } catch (err) {
            serverError(req, res, err);
        }
    }
}

module.exports = UnoController;