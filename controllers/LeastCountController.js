const _ = require('lodash');

const mongodb = require('../model/mongodb');
const { serverError } = require('../utils/ResponseUtil');
const GameUtil = require('../utils/GameUtil');
const LeastCountUtil = require('../utils/LeastCountUtil');

const GAME_NAME = 'leastcount';
const cards = GameUtil.getStandardDeck(LeastCountUtil.pointMapper);

class LeastCountController {

    static async start(req, res) {
        try {
            let { gameData, player } = req;
            const deckNeeds = Math.ceil(gameData.players.length / 4);
            const deck = GameUtil.shuffle(LeastCountUtil.getDeck(cards, deckNeeds));
            let playersCards = {}, playersPoints = {}, playersInGame = GameUtil.shuffle(gameData.players, { 'copy': true });
            for (let i = 0; i < playersInGame.length; i++) {
                const playerId = playersInGame[i]._id;
                playersCards[playerId] = [];
                playersPoints[playerId] = 0;
                for (let j = 0; j < 7; j++) {
                    const ind = _.random(0, deck.length - 1);
                    const card = deck[ind];
                    playersCards[playerId].push(card);
                    playersPoints[playerId] += card.point;
                    deck.splice(ind, 1);
                }
            }
            const ind = _.random(0, deck.length - 1);
            const lastCard = deck[ind];
            deck.splice(ind, 1);
            const $setObj = {
                status: 'STARTED',
                playersInGame,
                lastCards: [lastCard],
                playersCards,
                playersPoints,
                playersTotalPoints: {},
                deck,
                startedBy: player,
                currentPlayer: playersInGame[0],
                currentPlayerAction: 'DECIDE',
                updatedAt: new Date(), updatedBy: player
            };
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            const respObj = GameUtil.pickGamePublicFields(GAME_NAME, { ...$setObj, players: gameData.players }, player);
            res.json(respObj);
            io.emit(req.roomId, { event: 'GAME_STARTED', gameData: _.pick(respObj, ['updatedBy']) });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async show(req, res) {
        try {
            let { player } = req, { playersPoints, playersTotalPoints } = req.gameData;
            let isAnyoneHasMinimumPoints = LeastCountUtil.isAnyoneHasMinimumPoints(playersPoints, playersPoints[player._id]);
            let showResult = 'GOOD';
            if (isAnyoneHasMinimumPoints) {
                for (let id in playersPoints) {
                    playersPoints[id] = 0;
                }
                playersPoints[player._id] += 40;
                showResult = 'BAD';
            } else {
                playersPoints[player._id] = 0;
            }
            if (_.isEmpty(playersTotalPoints)) {
                playersTotalPoints = playersPoints;
            } else {
                for (let id in playersPoints) {
                    playersTotalPoints[id] += playersPoints[id];
                }
            }
            let isAnyOneReachedMaxPoint = _.max(_.values(playersTotalPoints)) >= 80;
            let $setObj = {
                status: isAnyOneReachedMaxPoint ?
                    'ENDED' :
                    'PLAYER_SHOWED',
                playersTotalPoints: playersTotalPoints,
                updatedAt: new Date(), updatedBy: player,
            }
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj, $push: { rounds: { playersPoints, showResult, showedBy: player } } });
            res.json($setObj)
            io.emit(req.roomId, { event: 'PLAYER_SHOWED', gameData: $setObj });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async noShow(req, res) {
        try {
            let $setObj = {
                currentPlayerAction: 'SUBMIT',
                updatedAt: new Date(), updatedBy: req.player
            }
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            res.sendStatus(200);
            io.emit(req.roomId, { event: 'PLAYER_NOT_SHOWED', gameData: $setObj });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async submit(req, res) {
        try {
            let { gameData, player, chosenCards, cardsIndex } = req;
            let $setObj = {
                currentPlayerAction: 'TAKE',
                currentPlayerDroppedCards: chosenCards,
                updatedAt: new Date(), updatedBy: player,
            };
            _.pullAt(gameData.playersCards[player._id], cardsIndex);
            let myCards = gameData.playersCards[player._id];
            const sumOfChosenCards = _.sumBy(chosenCards, o => LeastCountUtil.pointMapper(o.number));
            let myPoints = gameData.playersPoints[player._id] - sumOfChosenCards;
            $setObj[`playersCards.${player._id}`] = myCards;
            $setObj[`playersPoints.${player._id}`] = myPoints;
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            res.sendStatus(200);
            io.emit(req.roomId, {
                event: 'PLAYER_SUBMITTED_CARD',
                gameData: _.assign($setObj, {
                    player: _.assign(req.player, { cardsCount: myCards.length }),
                    playerDroppedCards: chosenCards,
                })
            });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async take(req, res) {
        try {
            let { gameData, player } = req;
            let $setObj = {
                currentPlayerAction: 'DECIDE',
                currentPlayer: GameUtil.getNextPlayer(gameData.players, gameData.currentPlayer),
                updatedAt: new Date(), updatedBy: player
            };
            let takenCard;
            switch (req.body.takeFrom) {
                case 'DECK':
                    takenCard = gameData.deck.splice(0, 1)[0];
                    $setObj.deck = gameData.deck;
                    break;
                case 'LASTCARD':
                    takenCard = gameData.lastCards.splice(0, 1)[0];
                    $setObj.lastCards = gameData.lastCards;
                    break;
            }
            gameData.playersCards[player._id].push(takenCard);
            gameData.playersPoints[player._id] += LeastCountUtil.pointMapper(takenCard.number);
            $setObj[`playersCards.${player._id}`] = gameData.playersCards[player._id];
            $setObj[`playersPoints.${player._id}`] = gameData.playersPoints[player._id];
            let lastCards = gameData.currentPlayerDroppedCards.concat(gameData.lastCards);
            let deck = gameData.deck.concat(lastCards.splice(2));
            GameUtil.shuffle(deck);
            _.assign($setObj, { lastCards, deck });
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            const respObj = GameUtil.pickGamePublicFields(GAME_NAME, $setObj, player);
            res.json(respObj);
            io.emit(req.roomId, {
                event: 'PLAYER_TOOK_CARD',
                gameData: _.assign(_.omit(respObj, 'myCards'), {
                    player: _.assign(req.player, { cardsCount: gameData.playersCards[player._id].length }),
                })
            });
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
            if (gameData.players.length && gameData.admin._id == player._id) {
                $setObj.admin = gameData.players[_.random(0, gameData.players.length - 1)];
            }
            if (gameData.status == 'STARTED') {
                delete gameData.playersPoints[player._id];
                delete gameData.playersTotalPoints[player._id];
                _.assign($setObj, {
                    playersPoints: gameData.playersPoints,
                    playersTotalPoints: gameData.playersTotalPoints,
                });
                if ($setObj.players.length == 1) {
                    $setObj.status = 'ENDED';
                } else {
                    $setObj.deck = GameUtil.shuffle(gameData.deck.concat(gameData.playersCards[player._id]));
                    delete gameData.playersCards[player._id];
                    $setObj.playersCards = gameData.playersCards;
                    if (gameData.currentPlayer._id == player._id) {
                        $setObj.currentPlayer = $setObj.players[playerIndex == $setObj.players.length ? 0 : playerIndex];
                    }
                }
            }
            let updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            res.sendStatus(200);
            io.emit(req.roomId, {
                event: 'PLAYER_LEFT_ROOM',
                gameData: { leftPlayerIndex: playerIndex, ..._.pick($setObj, ['updatedBy', 'updatedAt']) }
            });
        } catch (err) {
            serverError(req, res, err);
        }
    }

}

module.exports = LeastCountController;