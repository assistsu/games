const jwt = require('../utils/jwt');
const common = require('../utils/common');
const _ = require('lodash');

async function validatePlayer(req, res, next) {
    try {
        const playerToken = req.headers['x-player-token'];
        let player = jwt.verify(playerToken);
        req.player = _.pick(player, ['_id', 'name', 'isOnline']);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Player Token', errCode: 'INVALID_PLAYER_TOKEN' });
    }
}

function isValidFields(req, res, next) {
    let playerName = req.body.playerName;
    if (typeof playerName != "string" || playerName.trim().length == 0) {
        return res.status(400).json({ message: 'Player name should not be empty', errCode: 'EMPTY_PLAYER_NAME' });
    }
    playerName = playerName.trim();
    if (playerName.trim().length > 15) {
        return res.status(400).json({ message: 'Player name cannot be more than 15 letters', errCode: 'EXCEEDED_PLAYER_NAME' });
    }
    req.body.playerName = playerName;
    next();
}

module.exports = {
    validatePlayer, isValidFields
};