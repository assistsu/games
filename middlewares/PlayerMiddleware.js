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
        console.log("ERR::validatePlayer::" + req.path, err);
        return res.status(401.1).json({ message: 'Invalid Player Token', errCode: 'INVALID_PLAYER_TOKEN' });
    }
}

module.exports = { validatePlayer };