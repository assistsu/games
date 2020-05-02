const mongodb = require('../model/mongodb');
const _ = require('lodash');

function isValidRoomID(req, res, next) {
    try {
        req.roomObjectId = mongodb.ObjectId(req.params.id);
        next();
    } catch (err) {
        return res.status(400).json({ message: 'Invalid Room ID', errCode: 'INVALID_ROOM_ID' });
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

function isChosenCardValid(req, res, next) {
    const chosenCard = _.pick(req.body.chosenCard, ['type', 'number']);
    if (typeof chosenCard != "object") {
        return res.status(400).json({ message: 'Chosencard is invalid', errCode: 'INVALID_CARD' });
    }
    const { gameData, player } = req;
    const cardIndex = _.findIndex(gameData.playersCards[player._id], { type: chosenCard.type, number: chosenCard.number });
    if (cardIndex == -1) {
        return res.status(400).json({ message: 'Chosen card not present in your deck', errCode: 'CHOSEN_CARD_NOT_PRESENT' });
    }
    _.assign(req, { chosenCard, cardIndex });
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
    playerShouldPresentInGame,
    playerShouldNotPresentInGame,
    isChosenCardValid,
    isMyMove,
    isAdmin,
    gameStatusShouldBeCreated,
    gameStatusShouldBeStarted,
    gameStatusShouldBeEnded,
}