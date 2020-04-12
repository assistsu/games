const jwt = require('../utils/jwt');
const mongodb = require('../model/mongodb');

async function createPlayer(req, res) {
    try {
        const playerName = req.body.playerName;
        if (typeof playerName != "string" || playerName.trim().length == 0) {
            return res.status(400).json({ message: 'playerName should not be empty' });
        }
        const result = await mongodb.insertOne('players', { name: playerName, createdAt: new Date(), updatedAt: new Date() });
        const player = result.ops[0];
        player.token = jwt.sign(player);
        res.json(player);
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

exports.createPlayer = createPlayer;