const _ = require('lodash');
const CommonUtil = require('../utils/CommonUtil');
const ResponseUtil = require('../utils/ResponseUtil');
const mongodb = require('../model/mongodb');
const CommonModel = require('../model/Common');

const collectionName = 'ludo';

function getGameStatus(req, res) {
    try {
        res.json(req.gameData);
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

async function startGame(req, res) {
    try {
        let { gameData, player } = req;
        let playerTokens = {};
        gameData.players.forEach(o => {
            playerTokens[o._id] = {};
            for (let i = 1; i <= 4; i++) {
                playerTokens[o._id][`token_${i}`] = 'IN';
            }
        });
        const $setObj = {
            status: 'STARTED', startedBy: player,
            playerTokens,
            currentPlayer: gameData.players[CommonUtil.randomNumber(0, gameData.players.length - 1)],
            currentPlayerAction: 'ROLL_DICE',
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.json(_.assign($setObj, { playersInGame: gameData.players }));
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
        gameData.playersInGame.splice(playerIndex, 1);
        gameData.players.splice(_.findIndex(gameData.players, { _id: player._id }), 1);
        let $setObj = { assPlayers: {}, players: gameData.players, playersInGame: gameData.playersInGame, updatedAt: new Date(), updatedBy: player };
        if (gameData.players.length && gameData.admin._id == player._id) {
            $setObj.admin = gameData.players[CommonUtil.randomNumber(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.players.length == 1) {
                $setObj.status = 'ENDED';
            }
            if (gameData.players.length > 1 && gameData.currentPlayer._id == player._id) {
                $setObj.currentPlayer = CommonUtil.getNextPlayer(gameData.players, gameData.currentPlayer);
            }
        }
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

async function rollDice(req, res) {
    try {
        const currentDiceNumber = CommonUtil.randomNumber(1, 6);
        const $setObj = {
            currentPlayerAction: 'MOVE_TOKEN',
            currentDiceNumber,
            updatedAt: new Date(), updatedBy: player
        };
        let updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.json($setObj);
        io.emit(req.params.id, { event: 'ROLLED_DICE', gameData: $setObj });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function moveToken(req, res) {
    const currentDiceNumber = CommonUtil.randomNumber(1, 6);
        const $setObj = {
            currentPlayerAction: 'ROLL_DICE',
            currentDiceNumber,
            updatedAt: new Date(), updatedBy: player
        };
        let updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.json($setObj);
        io.emit(req.params.id, { event: 'MOVED_TOKEN', gameData: $setObj });
    try {
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

module.exports = {
    getGameStatus,
    createRoom,
    joinRoom,
    rollDice,
    moveToken,
    startGame,
    restart,
    leaveRoom,
}