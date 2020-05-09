const jwt = require('../utils/jwt');
const mongodb = require('../model/mongodb');
const ResponseUtil = require('../utils/ResponseUtil');

async function createPlayer(req, res) {
    try {
        const playerName = req.body.playerName;
        const result = await mongodb.insertOne('players', { name: playerName, createdAt: new Date(), updatedAt: new Date() });
        const player = result.ops[0];
        player.token = jwt.sign(player);
        res.json(player);
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

module.exports = {
    createPlayer,
}