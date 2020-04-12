const _ = require('lodash');
const mongodb = require('../model/mongodb');
const common = require('../utils/common');

function isValidRoomID(req, res, next) {
    try {
        req.roomObjectId = mongodb.ObjectId(req.params.id);
        next();
    } catch (err) {
        console.log("err::", err);
        return res.status(400).json({ message: err.message || 'Invalid Room ID', errCode: 'INVALID_ROOM_ID' });
    }
}

async function isRoomExist(req, res, next) {
    try {
        req.gameData = await mongodb.findById('uno', req.params.id);
        if (req.gameData == null) {
            return res.status(404).json({ message: 'Room Not found', errCode: 'ROOM_NOT_FOUND' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function playerShouldPresentInGame(req, res, next) {
    try {
        const playerIndex = _.findIndex(req.gameData.players, { _id: req.player._id });
        if (playerIndex == -1) {
            return res.status(401).json({ message: 'Player not found in Room', errCode: 'PLAYER_NOT_FOUND_IN_ROOM' });
        }
        req.playerIndex = playerIndex;
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function playerShouldNotPresentInGame(req, res, next) {
    try {
        const playerIndex = _.findIndex(req.gameData.players, { _id: req.player._id });
        if (playerIndex != -1) {
            return res.json({ message: 'Player already in Room', errCode: 'PLAYER_FOUND_IN_ROOM' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function isMyMove(req, res, next) {
    try {
        if (req.gameData.currentPlayer._id != req.player._id) {
            return res.status(401).json({ message: 'This is not your move', errCode: 'NOT_CURRENT_PLAYER' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function isAdmin(req, res, next) {
    try {
        if (req.gameData.admin._id != req.player._id) {
            return res.status(401).json({ message: 'You are not a admin', errCode: 'NOT_AN_ADMIN' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function gameStatusShouldBeCreated(req, res, next) {
    try {
        if (req.gameData.status != 'CREATED') {
            return res.status(400).json({ message: "Game status should be created", errCode: 'GAME_STATUS_IS_NOT_CREATED' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function gameStatusShouldBeStarted(req, res, next) {
    try {
        if (req.gameData.status != 'STARTED') {
            return res.status(400).json({ message: 'Game status should be started', errCode: 'GAME_STATUS_IS_NOT_STARTED' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function gameStatusShouldBeEnded(req, res, next) {
    try {
        if (req.gameData.status != 'ENDED') {
            return res.status(400).json({ message: 'Game status should be ended', errCode: 'GAME_STATUS_IS_NOT_ENDED' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
    }
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