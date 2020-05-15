const shuffle = require('shuffle-array');
const _ = require('lodash');
const AssUtil = require('../utils/AssUtil');
const CommonUtil = require('../utils/CommonUtil');
const ResponseUtil = require('../utils/ResponseUtil');
const mongodb = require('../model/mongodb');
const CommonModel = require('../model/Common');

const collectionName = 'ass';
const cards = CommonUtil.getStandardDeck(AssUtil.pointMapper);

function removePrivateFields(gameData, moreFields = []) {
    delete gameData.playersCards;
    delete gameData.games;
    delete gameData.rounds;
    moreFields.forEach(o => delete gameData[o]);
}

function preProcessGameData(gameData, $setObj = {}) {
    Object.assign(gameData, $setObj);
    gameData.players = gameData.players.map(o => Object.assign(o, { cardsCount: (gameData.playersCards[o._id] || []).length }));
    removePrivateFields(gameData);
}

function getGameStatus(req, res) {
    try {
        let { gameData, player } = req;
        const myCards = gameData.playersCards[player._id] || [];
        preProcessGameData(gameData);
        gameData.myCards = myCards;
        res.json(gameData);
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

function getCreataRoomInsertObj(roomName, player) {
    return {
        roomName: roomName,
        status: 'CREATED',
        players: [player],
        playersInGame: [player],
        allJoinedPlayers: [player],
        actions: [],
        messages: [],
        admin: player,
        playersCards: {},
        assPlayers: {},
        playerNudged: {},
        createdBy: player,
        createdAt: new Date(),
        updatedBy: player,
        updatedAt: new Date(),
    }
}

async function createRoom(req, res) {
    try {
        const insertObj = getCreataRoomInsertObj(req.body.roomName, req.player);
        const gameData = await mongodb.insertOne(collectionName, insertObj);
        res.json({ _id: gameData.ops[0]._id });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function joinRoom(req, res) {
    try {
        let { player } = req;
        let $setObj = { updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, {
            $push: { players: player, playersInGame: player, allJoinedPlayers: player },
            $set: $setObj
        });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_PLAYER_JOINED', gameData: { player: player, ...$setObj } });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

function removeDonePlayers(gameData, $setObj) {
    const donePlayers = _.filter(gameData.playersInGame, o => $setObj.playersCards[o._id].length == 0);
    donePlayers.map(o => {
        delete $setObj.playersCards[o._id];
        delete gameData.currentRoundPlayerCards[o._id];
        _.remove(gameData.playersInGame, { _id: o._id });
    });
    if (donePlayers.length) {
        $setObj.playersInGame = gameData.playersInGame;
    }
    return donePlayers;
}

async function submitCard(req, res) {
    try {
        let { gameData, player, chosenCard, cardIndex } = req;
        _.assign(chosenCard, { point: AssUtil.pointMapper(chosenCard.number) });
        let $setObj = {
            playersCards: gameData.playersCards,
            currentRoundPlayerCards: gameData.currentRoundPlayerCards,
            updatedAt: new Date(), updatedBy: player
        };
        let $pushObj = {};
        const currentRoundCards = _.values(gameData.currentRoundPlayerCards);
        const isSameType = currentRoundCards.length && currentRoundCards[0].type == chosenCard.type;
        const isLastCard = currentRoundCards.length == gameData.playersInGame.length - 1;
        $setObj.playersCards[player._id].splice(cardIndex, 1);
        if (currentRoundCards.length == 0 || (isSameType && !isLastCard)) {
            $setObj.currentRoundPlayerCards[player._id] = chosenCard;
            $setObj.currentPlayer = CommonUtil.getNextPlayer(gameData.playersInGame, player, 1);
        } else if (isSameType && isLastCard) {
            $setObj.currentRoundPlayerCards[player._id] = chosenCard;
            $pushObj.rounds = {
                type: 'ALL_SUBMITTED',
                playersCards: _.assign({}, gameData.currentRoundPlayerCards),
                donePlayers: removeDonePlayers(gameData, $setObj),
            };
            $setObj.currentRoundPlayerCards = {};
            $setObj.currentPlayer = AssUtil.getCurrentPlayer(gameData);
        }
        else {
            const isPlayerSpoofing = _.findIndex(gameData.playersCards[player._id], { type: currentRoundCards[0].type }) != -1;
            if (isPlayerSpoofing) return res.status(400).json({ message: 'Spoofing not allowed', errCode: 'PLAYER_SPOOFING' });
            const playerGotHit = AssUtil.getCurrentPlayer(gameData);
            $setObj.currentRoundPlayerCards[player._id] = chosenCard;
            gameData.playersCards[playerGotHit._id] = gameData.playersCards[playerGotHit._id].concat(_.values(gameData.currentRoundPlayerCards));
            $pushObj.rounds = {
                type: 'HIT',
                playerGotHit,
                hitBy: player,
                playersCards: _.assign({}, gameData.currentRoundPlayerCards),
                donePlayers: removeDonePlayers(gameData, $setObj),
            };
            $setObj.currentRoundPlayerCards = {};
            $setObj.currentPlayer = playerGotHit;
        }
        if (gameData.playersInGame.length <= 1) {
            $setObj.status = 'ENDED';
            if (gameData.assPlayers[gameData.playersInGame[0]] == null)
                gameData.assPlayers[gameData.playersInGame[0]] = 0;
            gameData.assPlayers[gameData.playersInGame[0]]++;
            $setObj.assPlayers = gameData.assPlayers;
        }
        let updateObj = { $set: $setObj };
        if (_.keys($pushObj).length) {
            updateObj.$push = $pushObj;
        }
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, updateObj);
        preProcessGameData($setObj, {
            playersInGame: gameData.playersInGame, players: gameData.players,
            lastRound: $pushObj.rounds, currentRoundPlayerCards: gameData.currentRoundPlayerCards
        });
        io.emit(req.params.id, { event: 'PLAYER_SUBMITTED_CARD', gameData: { ...$setObj } });
        $setObj.myCards = gameData.playersCards[player._id] || [];
        res.json($setObj);
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function startGame(req, res) {
    try {
        let { gameData, player } = req;
        const deck = shuffle(cards, { 'copy': true });
        let playersCards = {}, players = shuffle(gameData.players, { 'copy': true });
        let _currentPlayer = players[_.random(0, players.length - 1)];
        let currentPlayer;
        for (let i = 0; i < 52; i++) {
            if (playersCards[_currentPlayer._id] == null) { playersCards[_currentPlayer._id] = [] }
            const ind = _.random(0, deck.length - 1);
            playersCards[_currentPlayer._id].push(deck[ind]);
            if (deck[ind].type == 'SPADE' && deck[ind].number == 'A') {
                currentPlayer = _currentPlayer;
            }
            deck.splice(ind, 1);
            _currentPlayer = CommonUtil.getNextPlayer(players, _currentPlayer, 1);
        }
        const $setObj = {
            status: 'STARTED', currentRoundPlayerCards: {}, playersCards, rounds: [], startedBy: player,
            playersInGame: players,
            players,
            escapedPlayers: [],
            currentPlayer,
            updatedAt: new Date(), updatedBy: player
        };
        // $setObj.currentPlayer = players[0];
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        preProcessGameData($setObj, { players: gameData.players, playersInGame: $setObj.playersInGame });
        $setObj.myCards = playersCards[player._id];
        res.json($setObj);
        io.emit(req.params.id, { event: 'GAME_STARTED', gameData: _.pick($setObj, ['updatedAt', 'updatedBy']) });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function restart(req, res) {
    try {
        let { gameData, player } = req;
        const $setObj = { status: 'CREATED', playersInGame: gameData.players, assPlayers: {}, updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        CommonModel.storeEndedGameData(collectionName, _.assign(gameData, _.pick($setObj, ['updatedAt', 'updatedBy'])));
        res.json($setObj);
        io.emit(req.params.id, { event: 'GAME_RESTARTED', gameData: $setObj });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function leaveRoom(req, res) {
    try {
        let { gameData, player, playerIndex } = req;
        _.remove(gameData.players, { _id: player._id });
        let $setObj = {
            assPlayers: {},
            players: gameData.players,
            playersInGame: gameData.playersInGame,
            updatedAt: new Date(), updatedBy: player
        };
        if (gameData.players.length && gameData.admin._id == player._id) {
            $setObj.admin = gameData.players[_.random(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.playersInGame.length > 2) {
                if (gameData.currentPlayer._id == player._id) {
                    if (_.keys(gameData.currentRoundPlayerCards).length == 0) {
                        const lastRound = _.nth(gameData.rounds, -1);
                        if (lastRound) {
                            if (lastRound.type == 'HIT') {
                                delete lastRound.playersCards[lastRound.hitBy._id];
                            }
                            gameData.currentRoundPlayerCards = _.pick(lastRound.playersCards, gameData.playersInGame.map(o => o._id == player._id ? '' : o._id));
                            $setObj.currentPlayer = AssUtil.getCurrentPlayer(gameData);
                        } else {
                            $setObj.currentPlayer = CommonUtil.getNextPlayer(gameData.playersInGame, player, 1);
                        }
                    } else {
                        delete gameData.currentRoundPlayerCards[player._id];
                        $setObj.currentRoundPlayerCards = gameData.currentRoundPlayerCards;
                        $setObj.currentPlayer = CommonUtil.getNextPlayer(gameData.playersInGame, player, 1);
                    }
                } else {
                    delete gameData.currentRoundPlayerCards[player._id];
                    $setObj.currentRoundPlayerCards = gameData.currentRoundPlayerCards;
                }
            } else {
                $setObj.status = 'ENDED';
            }
        }
        $setObj.playersInGame.splice(playerIndex, 1);
        let updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'PLAYER_LEFT_ROOM',
            gameData: { leftPlayerIndex: playerIndex, ..._.pick($setObj, ['updatedBy', 'updatedAt']) }
        });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function newMessage(req, res) {
    try {
        const { text } = req.body;
        let { player } = req;
        const message = { text: text, ...player, createdAt: new Date() };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $push: { messages: message } });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_MESSAGE', gameData: { message: message } });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function nudgePlayer(req, res) {
    try {
        const { playerId } = req.body;
        if (req.player._id == playerId) return res.status(400).json({ message: 'You cannot nudge yourself', errCode: 'NUDGING_HIMSELF' });
        if (_.findIndex(req.gameData.players, { _id: playerId }) == -1) return res.status(400).json({ message: 'The player you are nudging not in your room', errCode: 'NUDGE_PLAYER_NOT_IN_ROOM' });
        // if (req.gameData.playerNudged && req.gameData.playerNudged[playerId]) {
        //     const diff = new Date().getTime() - req.gameData.playerNudged[playerId];
        //     if (diff < 3000) {
        //         return res.status(400).json({ message: 'Player already nudged', errCode: 'PLAYER_NUDGED_ALREADY' });
        //     }
        // }
        // let $setObj = {};
        // $setObj[`playerNudged.${playerId}`] = new Date().getTime();
        // const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(playerId, { event: 'NUDGED', nudgedBy: req.player });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

module.exports = {
    getGameStatus,
    createRoom,
    joinRoom,
    submitCard,
    startGame,
    restart,
    leaveRoom,
    newMessage,
    nudgePlayer
}