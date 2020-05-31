const _ = require('lodash');
const { responses } = require('../utils/ResponseUtil');

class GameMiddleware {
    static isValidGameName(req, res, next) {
        const { gameName } = req[req.method == 'GET' ? 'query' : 'body'];
        switch (gameName) {
            case 'uno':
            case 'ass':
            case 'leastcount':
                req.gameName = gameName;
                return next();
            default:
                return res.status(400).json(responses.INVALID_GAME_NAME);
        }
    }

    static isValidRoomName(req, res, next) {
        let { roomName } = req.body;
        if (!_.isString(roomName)) {
            return res.status(400).json(responses.INVALID_ROOM_NAME_TYPE);
        }
        roomName = roomName.trim();
        if (_.isEmpty(roomName)) {
            return res.status(400).json(responses.EMPTY_ROOM_NAME);
        }
        if (roomName.length > 15) {
            return res.status(400).json(responses.ROOM_NAME_LENGTH_EXCEEDED);
        }
        req.body.roomName = roomName;
        next();
    }

    static playerShouldPresent(req, res, next) {
        const playerIndex = _.findIndex(req.gameData.players, { _id: req.player._id });
        if (playerIndex == -1) {
            return res.status(401).json(responses.PLAYER_NOT_FOUND_IN_ROOM);
        }
        req.playerIndex = playerIndex;
        next();
    }

    static playerShouldPresentInGame(req, res, next) {
        const playerIndex = _.findIndex(req.gameData.playersInGame, { _id: req.player._id });
        if (playerIndex == -1) {
            return res.status(401).json(responses.PLAYER_NOT_FOUND_IN_GAME);
        }
        req.playerIndex = playerIndex;
        next();
    }

    static playerShouldNotPresent(req, res, next) {
        const playerIndex = _.findIndex(req.gameData.players, { _id: req.player._id });
        if (playerIndex != -1) {
            return res.json(responses.PLAYER_FOUND_IN_ROOM);
        }
        next();
    }

    static isChosenCardValid(req, res, next) {
        const chosenCard = _.pick(req.body.chosenCard, ['type', 'number']);
        if (_.isEmpty(chosenCard)) {
            return res.status(400).json(responses.INVALID_CARD);
        }
        const { gameData, player } = req;
        const cardIndex = _.findIndex(gameData.playersCards[player._id], { type: chosenCard.type, number: chosenCard.number });
        if (cardIndex == -1) {
            return res.status(400).json(responses.CHOSEN_CARD_NOT_PRESENT);
        }
        _.assign(req, { chosenCard, cardIndex });
        next();
    }

    static isMyMove(req, res, next) {
        if (req.gameData.currentPlayer._id != req.player._id) {
            return res.status(401).json(responses.NOT_YOUR_MOVE);
        }
        next();
    }

    static isAdmin(req, res, next) {
        if (req.gameData.admin._id != req.player._id) {
            return res.status(401).json(responses.NOT_AN_ADMIN);
        }
        next();
    }

    static gameStatusShouldBeCreated(req, res, next) {
        if (req.gameData.status != 'CREATED') {
            return res.status(400).json(responses.GAME_STATUS_IS_NOT_CREATED);
        }
        next();
    }

    static gameStatusShouldBeStarted(req, res, next) {
        if (req.gameData.status != 'STARTED') {
            return res.status(400).json(responses.GAME_STATUS_IS_NOT_STARTED);
        }
        next();
    }

    static gameStatusShouldBeEnded(req, res, next) {
        if (req.gameData.status != 'ENDED') {
            return res.status(400).json(responses.GAME_STATUS_IS_NOT_ENDED);
        }
        next();
    }

    static isRoomFull(req, res, next) {
        if (req.gameData.players.length >= req.gameData.maxPlayers) {
            return res.status(400).json(responses.ROOM_IS_FULL);
        }
        next();
    }

    static isMinPlayersPresent(req, res, next) {
        if (req.gameData.players.length < req.gameData.minPlayers) {
            return res.status(400).json(responses.MIN_PLAYERS_NOT_PRESENT(req.gameData.minPlayers));
        }
        next();
    }

    static isValidMessage(req, res, next) {
        let { text } = req.body;
        if (!_.isString(text)) {
            return res.status(400).json(responses.INVALID_MESSAGE_TYPE);
        }
        text = text.trim();
        if (_.isEmpty(text)) {
            return res.status(400).json(responses.EMPTY_MESSAGE);
        }
        if (text.trim().length > 200) {
            return res.status(400).json(responses.MESSAGE_LENGTH_EXCEED);
        }
        req.body.text = text;
        next();
    }
}

module.exports = GameMiddleware;