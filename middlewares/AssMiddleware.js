const _ = require('lodash');
const mongodb = require('../model/mongodb');
const common = require('../utils/common');
const ass = require('../utils/ass');

async function isRoomExist(req, res, next) {
    try {
        req.gameData = await mongodb.findById('ass', req.params.id);
        if (!req.gameData) {
            return res.status(404).json({ message: 'Room Not found', errCode: 'ROOM_NOT_FOUND' });
        }
        next();
    } catch (err) {
        common.serverError(req, res, err);
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

function isChosenCardValid(req, res, next) {
    const chosenCard = _.pick(req.body.chosenCard, ['type', 'number']);
    chosenCard.number = parseInt(chosenCard.number);
    if (!ass.cardTypes.includes(chosenCard.type) || !(chosenCard.number > 1) || !(chosenCard.number < 15)) {
        return res.status(400).json({ message: 'Chosencard is invalid', errCode: 'INVALID_CARD' });
    }
    req.chosenCard = chosenCard;
    next();
}

function isChosenCardPresentInPlayerDeck(req, res, next) {
    const { gameData, player, chosenCard } = req;
    req.cardIndex = _.findIndex(gameData.playersCards[player._id], { type: chosenCard.type, number: chosenCard.number });
    if (req.cardIndex == -1) {
        return res.status(400).json({ message: 'Chosen card not present in your deck', errCode: 'CHOSEN_CARD_NOT_PRESENT' });
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
    isChosenCardValid,
    isChosenCardPresentInPlayerDeck,
    playerShouldPresentInGame,
}