const jwt = require('../utils/jwt');
const mongodb = require('../model/mongodb');
const common = require('../utils/common');

async function createPlayer(req, res) {
    try {
        const playerName = req.body.playerName;
        const result = await mongodb.insertOne('players', { name: playerName, createdAt: new Date(), updatedAt: new Date() });
        const player = result.ops[0];
        player.token = jwt.sign(player);
        res.json(player);
    } catch (err) {
        common.serverError(req, res, err);
    }
}

exports.createPlayer = createPlayer;