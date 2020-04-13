const _ = require('lodash');
const mongodb = require('../model/mongodb');
const UnoModel = require('../model/UnoModel');
const common = require('../utils/common');

function isValidRoomID(req, res, next) {
    try {
        req.roomObjectId = mongodb.ObjectId(req.params.id);
        next();
    } catch (err) {
        return res.status(400).json({ message: 'Invalid Room ID', errCode: 'INVALID_ROOM_ID' });
    }
}

async function isRoomExist(req, res, next) {
    try {
        req.gameData = await UnoModel.getGameInfo(req.params.id);
        if (!req.gameData) {
            return res.status(404).json({ message: 'Room Not found', errCode: 'ROOM_NOT_FOUND' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function playerShouldPresentInGame(req, res, next) {
    const playerIndex = _.findIndex(req.gameData.players, { _id: req.player._id });
    if (playerIndex == -1) {
        return res.status(401).json({ message: 'Player not found in Room', errCode: 'PLAYER_NOT_FOUND_IN_ROOM' });
    }
    req.playerIndex = playerIndex;
    next();
}

function playerShouldNotPresentInGame(req, res, next) {
    const playerIndex = _.findIndex(req.gameData.players, { _id: req.player._id });
    if (playerIndex != -1) {
        return res.json({ message: 'Player already in Room', errCode: 'PLAYER_FOUND_IN_ROOM' });
    }
    next();
}

function isMyMove(req, res, next) {
    if (req.gameData.currentPlayer._id != req.player._id) {
        return res.status(401).json({ message: 'This is not your move', errCode: 'NOT_YOUR_MOVE' });
    }
    next();
}

function isAdmin(req, res, next) {
    if (req.gameData.admin._id != req.player._id) {
        return res.status(401).json({ message: 'You are not a admin', errCode: 'NOT_AN_ADMIN' });
    }
    next();
}

function gameStatusShouldBeCreated(req, res, next) {
    if (req.gameData.status != 'CREATED') {
        return res.status(400).json({ message: "Game status should be created", errCode: 'GAME_STATUS_IS_NOT_CREATED' });
    }
    next();
}

function gameStatusShouldBeStarted(req, res, next) {
    if (req.gameData.status != 'STARTED') {
        return res.status(400).json({ message: 'Game status should be started', errCode: 'GAME_STATUS_IS_NOT_STARTED' });
    }
    next();
}

function gameStatusShouldBeEnded(req, res, next) {
    if (req.gameData.status != 'ENDED') {
        return res.status(400).json({ message: 'Game status should be ended', errCode: 'GAME_STATUS_IS_NOT_ENDED' });
    }
    next();
}

module.exports = {
    isValidRoomID,
    isRoomExist,
    playerShouldPresentInGame,
    playerShouldNotPresentInGame,
    isMyMove,
    isAdmin,
    gameStatusShouldBeCreated,
    gameStatusShouldBeStarted,
    gameStatusShouldBeEnded,
}