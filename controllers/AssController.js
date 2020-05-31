const _ = require('lodash');

const mongodb = require('../model/mongodb');
const { responses, serverError } = require('../utils/ResponseUtil');
const GameUtil = require('../utils/GameUtil');
const AssUtil = require('../utils/AssUtil');

const GAME_NAME = 'ass';
const cards = GameUtil.getStandardDeck(AssUtil.pointMapper);

class AssController {

    static async start(req, res) {
        try {
            let { gameData, player } = req;
            const deck = GameUtil.shuffle(cards, { 'copy': true });
            let playersCards = {}, playersInGame = GameUtil.shuffle(gameData.players, { 'copy': true });
            let _currentPlayer = playersInGame[0];
            let currentPlayer;
            for (let i = 0; i < 52; i++) {
                if (playersCards[_currentPlayer._id] == null) { playersCards[_currentPlayer._id] = [] }
                const ind = _.random(0, deck.length - 1);
                playersCards[_currentPlayer._id].push(deck[ind]);
                if (deck[ind].type == 'SPADE' && deck[ind].number == 'A') {
                    currentPlayer = _currentPlayer;
                }
                deck.splice(ind, 1);
                _currentPlayer = GameUtil.getNextPlayer(playersInGame, _currentPlayer);
            }
            const $setObj = {
                status: 'STARTED',
                currentRoundPlayerCards: {},
                playersCards,
                rounds: [],
                startedBy: player,
                playersInGame,
                escapedPlayers: [],
                currentPlayer,
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
            let { gameData, player, chosenCard, cardIndex } = req;
            _.assign(chosenCard, { point: AssUtil.pointMapper(chosenCard.number) });
            let $setObj = {
                playersCards: gameData.playersCards,
                currentRoundPlayerCards: _.cloneDeep(gameData.currentRoundPlayerCards),
                updatedAt: new Date(), updatedBy: player
            };
            let $pushObj = {};
            const currentRoundCards = _.values($setObj.currentRoundPlayerCards);
            const isSameType = currentRoundCards.length && currentRoundCards[0].type == chosenCard.type;
            const isLastCard = currentRoundCards.length == gameData.playersInGame.length - 1;
            $setObj.playersCards[player._id].splice(cardIndex, 1);
            if (currentRoundCards.length == 0 || (isSameType && !isLastCard)) {
                $setObj.currentRoundPlayerCards[player._id] = chosenCard;
                $setObj.currentPlayer = GameUtil.getNextPlayer(gameData.playersInGame, player);
            } else if (isSameType && isLastCard) {
                $setObj.currentRoundPlayerCards[player._id] = chosenCard;
                $pushObj.rounds = {
                    type: 'ALL_SUBMITTED',
                    playersCards: $setObj.currentRoundPlayerCards,
                    donePlayers: AssUtil.removeDonePlayers(gameData, $setObj),
                };
                $setObj.currentRoundPlayerCards = {};
                $setObj.currentPlayer = AssUtil.getCurrentPlayer(gameData);
            }
            else {
                const isPlayerSpoofing = _.findIndex(gameData.playersCards[player._id], { type: currentRoundCards[0].type }) != -1;
                if (isPlayerSpoofing) return res.status(400).json(responses.PLAYER_SPOOFING);
                const playerGotHit = AssUtil.getCurrentPlayer(gameData);
                $setObj.currentRoundPlayerCards[player._id] = chosenCard;
                gameData.playersCards[playerGotHit._id] = gameData.playersCards[playerGotHit._id].concat(_.values($setObj.currentRoundPlayerCards));
                $pushObj.rounds = {
                    type: 'HIT',
                    playerGotHit,
                    hitBy: player,
                    playersCards: $setObj.currentRoundPlayerCards,
                    donePlayers: AssUtil.removeDonePlayers(gameData, $setObj),
                };
                $setObj.currentRoundPlayerCards = {};
                $setObj.currentPlayer = playerGotHit;
            }
            if (gameData.playersInGame.length <= 1) {
                $setObj.status = 'ENDED';
                if (gameData.assPlayers[gameData.playersInGame[0]] == null) {
                    gameData.assPlayers[gameData.playersInGame[0]] = 0;
                }
                gameData.assPlayers[gameData.playersInGame[0]]++;
                $setObj.assPlayers = gameData.assPlayers;
            }
            let updateObj = { $set: $setObj };
            if (!_.isEmpty($pushObj)) {
                updateObj.$push = $pushObj;
            }
            const updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, updateObj);
            _.assign($setObj, _.pick(gameData, ['playersInGame', 'players']));
            const respObj = GameUtil.pickGamePublicFields(GAME_NAME, $setObj, player);
            const emitObj = _.omit(respObj, ['myCards', 'lastRound']);
            if (!_.isEmpty($pushObj)) {
                respObj.lastRound = $pushObj.rounds;
                emitObj.lastRound = GameUtil.getLastRoundInfo(respObj.lastRound, {});
            } else {
                delete respObj.lastRound;
            }
            res.json(respObj);
            io.emit(req.roomId, { event: 'PLAYER_SUBMITTED_CARD', gameData: emitObj });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async leave(req, res) {
        try {
            let { gameData, player, playerIndex } = req;
            _.remove(gameData.players, { _id: player._id });
            let $setObj = {
                assPlayers: {},
                players: gameData.players,
                updatedAt: new Date(), updatedBy: player
            };
            if (gameData.players.length && gameData.admin._id == player._id) {
                $setObj.admin = gameData.players[_.random(0, gameData.players.length - 1)];
            }
            if (gameData.status == 'STARTED') {
                gameData.playersInGame.splice(playerIndex, 1);
                $setObj.playersInGame = gameData.playersInGame;
                if ($setObj.playersInGame.length == 1) {
                    $setObj.status = 'ENDED';
                } else {
                    if (gameData.currentPlayer._id == player._id) {
                        let flag = true;
                        if (_.isEmpty(gameData.currentRoundPlayerCards)) {
                            let dec = 0;
                            while (gameData.rounds.length + dec != 0) {
                                const lastRound = _.nth(gameData.rounds, --dec);
                                const { playersCards, type, hitBy } = lastRound;
                                if (type == 'HIT') {
                                    delete playersCards[hitBy._id];
                                }
                                delete playersCards[player._id];
                                if (_.isEmpty(playersCards)) continue;
                                flag = false;
                                $setObj.currentPlayer = AssUtil.getCurrentPlayer({ playersInGame: $setObj.playersInGame, currentRoundPlayerCards: playersCards });
                            }
                        }
                        if (flag) {
                            $setObj.currentPlayer = $setObj.playersInGame[playerIndex == $setObj.playersInGame.length ? 0 : playerIndex];
                        }
                    }
                    else if (gameData.currentRoundPlayerCards[player._id]) {
                        delete gameData.currentRoundPlayerCards[player._id];
                        $setObj.currentRoundPlayerCards = gameData.currentRoundPlayerCards;
                    }
                }
            }
            let updatedGameData = await mongodb.updateById(GAME_NAME, req.roomObjectId, { $set: $setObj });
            res.sendStatus(200);
            io.emit(req.roomId, {
                event: 'PLAYER_LEFT_ROOM',
                gameData: { leftPlayerIndex: playerIndex, ..._.pick($setObj, ['updatedBy']) }
            });
        } catch (err) {
            serverError(req, res, err);
        }
    }

}

module.exports = AssController;