const _ = require('lodash');
const mongodb = require('../model/mongodb');
const ResponseUtil = require('../utils/ResponseUtil');

async function isRoomExist(req, res, next) {
    try {
        req.gameData = await mongodb.findById('ass', req.params.id);
        if (!req.gameData) {
            return res.status(404).json({ message: 'Room Not found', errCode: 'ROOM_NOT_FOUND' });
        }
        next();
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

function isMinimumPlayersReached(req, res, next) {
    if (req.gameData.players.length < 2) {
        return res.status(400).json({ message: 'Atleast 2 players needed to start a game', errCode: 'CANT_START_GAME' });
    }
    next();
}

function isMaximumPlayersReached(req, res, next) {
    if (req.gameData.players.length >= 13) {
        return res.status(400).json({ message: 'Room is Full', errCode: 'ROOM_IS_FULL' });
    }
    next();
}

function playerShouldPresentInGame(req, res, next) {
    const playerIndex = _.findIndex(req.gameData.playersInGame, { _id: req.player._id });
    if (playerIndex == -1) {
        return res.status(401).json({ message: 'Player not found in Room', errCode: 'PLAYER_NOT_FOUND_IN_ROOM' });
    }
    req.playerIndex = playerIndex;
    next();
}

module.exports = {
    isRoomExist,
    isMinimumPlayersReached,
    isMaximumPlayersReached,
    playerShouldPresentInGame,
}