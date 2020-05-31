const _ = require('lodash');
const { responses } = require('../utils/ResponseUtil');
const GameMiddleware = require('./GameMiddleware');
const UnoUtil = require('../utils/UnoUtil');

class UnoMiddleware extends GameMiddleware {
    static isChosenCardValid(req, res, next) {
        const chosenCard = _.pick(req.body.chosenCard, ['color', 'type', 'chosenColor']);
        const cardIndex = _.findIndex(req.gameData.playersCards[req.player._id], { color: chosenCard.color, type: chosenCard.type });
        if (cardIndex == -1) {
            return res.status(400).json(responses.CHOSEN_CARD_NOT_PRESENT);
        }
        if (chosenCard.color == 'dark') {
            if (_.isEmpty(chosenCard.chosenColor)) {
                return res.status(400).json(responses.CHOSEN_COLOR_NOT_PRESENT);
            }
            else if (!UnoUtil.card_colours.includes(chosenCard.chosenColor)) {
                return res.status(400).json(responses.INVALID_CHOSEN_COLOR);
            }
        } else {
            delete chosenCard.chosenColor;
        }
        if (!UnoUtil.isActionValid(req.gameData.lastCard, chosenCard)) {
            return res.status(400).json(responses.CHOSEN_CARD_NOT_MATCHED);
        }
        res.cardIndex = cardIndex;
        next();
    }
}

module.exports = UnoMiddleware;