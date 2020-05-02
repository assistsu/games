const _ = require('lodash');
const mongodb = require('../model/mongodb');
const CommonUtil = require('../utils/CommonUtil');
const LeastCountUtil = require('../utils/LeastCountUtil');

async function isRoomExist(req, res, next) {
    try {
        req.gameData = await mongodb.findById('leastcount', req.params.id);
        if (!req.gameData) {
            return res.status(404).json({ message: 'Room Not found', errCode: 'ROOM_NOT_FOUND' });
        }
        next();
    } catch (err) {
        CommonUtil.serverError(req, res, err);
    }
}

function isMinimumPlayersReached(req, res, next) {
    if (req.gameData.players.length < 2) {
        return res.status(400).json({ message: 'Atleast 2 players needed to start a game', errCode: 'CANT_START_GAME' });
    }
    next();
}

function isMaximumPlayersReached(req, res, next) {
    if (req.gameData.players.length >= 15) {
        return res.status(400).json({ message: 'Room is Full', errCode: 'ROOM_IS_FULL' });
    }
    next();
}

function isChosenCardValid(req, res, next) {
    let { chosenCards } = req.body;
    if (!_.isArray(chosenCards) || chosenCards.length == 0) {
        return res.status(400).json({ message: "You didn't choose any cards", errCode: 'EMPTY_CHOSEN_CARDS' });
    }
    let chosenNumber = null, cardsIndex = [], map = {};
    for (let i = 0; i < chosenCards.length; i++) {
        const chosenCard = _.pick(chosenCards[i], ['type', 'number']);
        const chosenCardAsKey=JSON.stringify(chosenCard);
        const cardIndex = _.findIndex(req.gameData.playersCards[req.player._id], chosenCard, map[chosenCardAsKey] || 0);
        if (cardIndex == -1) {
            return res.status(400).json({ message: 'Chosen card not present in your deck', errCode: 'CHOSEN_CARD_NOT_PRESENT' });
        }
        map[chosenCardAsKey] = cardIndex + 1;
        if (chosenNumber == null) { chosenNumber = chosenCard.number; }
        if (chosenCard.number != chosenNumber) {
            return res.status(400).json({ message: 'Chosencards numbers are not same', errCode: 'NOT_SAME_NUMBERS' });
        }
        cardsIndex.push(cardIndex);
        chosenCards[i] = chosenCard;
    }
    req.chosenCards = chosenCards;
    req.cardsIndex = cardsIndex;
    next();
}

function isPlayerActionSubmit(req, res, next) {
    if (req.gameData.currentPlayerAction != 'SUBMIT') {
        return res.status(400).json({ message: 'Your action should be submitting card', errCode: 'PLAYER_ACTION_NOT_SUBMIT' });
    }
    next();
}

function isPlayerActionTake(req, res, next) {
    if (req.gameData.currentPlayerAction != 'TAKE') {
        return res.status(400).json({ message: 'Your action should be taking card', errCode: 'PLAYER_ACTION_NOT_TAKE' });
    }
    next();
}

function isPlayerActionDecide(req, res, next) {
    if (req.gameData.currentPlayerAction != 'DECIDE') {
        return res.status(400).json({ message: "You didn't taken card yet", errCode: 'PLAYER_ACTION_NOT_DECIDE' });
    }
    next();
}

function validateTakeCardFields(req, res, next) {
    let { takeFrom } = req.body;
    if (!['DECK', 'LASTCARD'].includes(takeFrom)) {
        return res.status(400).json({ message: 'Invalid take from', errCode: 'INVALID_TAKE_FROM' });
    }
    next();
}

function gameStatusShouldbePlayerShowed(req, res, next) {
    if (req.gameData.status != 'PLAYER_SHOWED') {
        return res.status(400).json({ message: 'No Player has showed cards', errCode: 'GAME_STATUS_IS_NOT_PLAYER_SHOWED' });
    }
    next();
}

function setCollectionName(req, res, next) {
    req.CollectionName = 'leastcount';
    next();
}

module.exports = {
    isRoomExist,
    isMinimumPlayersReached,
    isMaximumPlayersReached,
    isChosenCardValid,
    isPlayerActionSubmit,
    isPlayerActionTake,
    isPlayerActionDecide,
    validateTakeCardFields,
    gameStatusShouldbePlayerShowed,
    setCollectionName,
}