const _ = require('lodash');
const jwt = require('../utils/jwt');
const { responses } = require('../utils/ResponseUtil');

class PlayerMiddleware {
    static validatePlayer(req, res, next) {
        try {
            const playerToken = req.headers['x-player-token'];
            let player = jwt.verify(playerToken);
            req.player = _.pick(player, ['_id', 'name', 'isOnline']);
            next();
        } catch (err) {
            return res.status(401).json(responses.INVALID_PLAYER_TOKEN);
        }
    }

    static isValidFields(req, res, next) {
        let { playerName } = req.body;
        if (!_.isString(playerName)) {
            return res.status(400).json(responses.INVALID_PLAYER_NAME_TYPE);
        }
        playerName = playerName.trim();
        if (_.isEmpty(playerName)) {
            return res.status(400).json(responses.EMPTY_PLAYER_NAME);
        }
        if (playerName.trim().length > 15) {
            return res.status(400).json(responses.EXCEEDED_PLAYER_NAME);
        }
        req.body.playerName = playerName;
        next();
    }
}

module.exports = PlayerMiddleware;