const _ = require('lodash');
const GameMiddleware = require('./GameMiddleware');
const { responses } = require('../utils/ResponseUtil');

class LeastCountMiddleware extends GameMiddleware {
    static isChosenCardValid(req, res, next) {
        let { chosenCards } = req.body;
        if (!_.isArray(chosenCards) || chosenCards.length == 0) {
            return res.status(400).json(responses.EMPTY_CHOSEN_CARDS);
        }
        let chosenNumber = null, cardsIndex = [], map = {};
        for (let i = 0; i < chosenCards.length; i++) {
            const chosenCard = _.pick(chosenCards[i], ['type', 'number']);
            const chosenCardAsKey = JSON.stringify(chosenCard);
            const cardIndex = _.findIndex(req.gameData.playersCards[req.player._id], chosenCard, map[chosenCardAsKey] || 0);
            if (cardIndex == -1) {
                return res.status(400).json(responses.CHOSEN_CARD_NOT_PRESENT);
            }
            map[chosenCardAsKey] = cardIndex + 1;
            if (chosenNumber == null) { chosenNumber = chosenCard.number; }
            if (chosenCard.number != chosenNumber) {
                return res.status(400).json(responses.NOT_SAME_NUMBERS);
            }
            cardsIndex.push(cardIndex);
            chosenCards[i] = chosenCard;
        }
        req.chosenCards = chosenCards;
        req.cardsIndex = cardsIndex;
        next();
    }

    static isPlayerActionSubmit(req, res, next) {
        if (req.gameData.currentPlayerAction != 'SUBMIT') {
            return res.status(400).json(responses.PLAYER_ACTION_NOT_SUBMIT);
        }
        next();
    }

    static isPlayerActionTake(req, res, next) {
        if (req.gameData.currentPlayerAction != 'TAKE') {
            return res.status(400).json(responses.PLAYER_ACTION_NOT_TAKE);
        }
        next();
    }

    static isPlayerActionDecide(req, res, next) {
        if (req.gameData.currentPlayerAction != 'DECIDE') {
            return res.status(400).json(responses.PLAYER_ACTION_NOT_DECIDE);
        }
        next();
    }

    static validateTakeCardFields(req, res, next) {
        let { takeFrom } = req.body;
        if (!['DECK', 'LASTCARD'].includes(takeFrom)) {
            return res.status(400).json(responses.INVALID_TAKE_FROM);
        }
        next();
    }

    static gameStatusShouldbePlayerShowed(req, res, next) {
        if (req.gameData.status != 'PLAYER_SHOWED') {
            return res.status(400).json(responses.GAME_STATUS_IS_NOT_PLAYER_SHOWED);
        }
        next();
    }
}

module.exports = LeastCountMiddleware;