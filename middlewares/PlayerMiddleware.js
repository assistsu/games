const jwt = require('jsonwebtoken');
const assert = require('assert');
const { JWT_SECRET_KEY } = require('../config');

function validatePlayer(req, res, next) {
    try {
        const playerToken = req.headers['x-player-token'];
        const player = jwt.verify(playerToken, JWT_SECRET_KEY);
        assert.equal(typeof player._id, "string");
        req.player = player;
        next();
    } catch (err) {
        console.log("ERR::validatePlayer::" + req.path, err);
        return res.status(401).json({ message: 'Login Required' });
    }
}

module.exports = { validatePlayer };