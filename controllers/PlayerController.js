const jwt = require('jsonwebtoken');
const mongodb = require('../model/mongodb');
const { JWT_SECRET_KEY } = require('../config');

async function createPlayer(req, res) {
    try {
        const userName = req.body.userName;
        if (typeof userName != "string" || userName.trim().length == 0) {
            return res.status(400).json({ message: 'userName should not be empty' });
        }
        const result = await mongodb.insertOne('players', { name: userName, createdAt: new Date(), updatedAt: new Date() });
        const user = result.ops[0];
        user.token = jwt.sign(user, JWT_SECRET_KEY);
        res.json(user);
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

exports.createPlayer = createPlayer;