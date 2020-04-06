const express = require('express');
const app = express.Router();

const unoRouter = require('./uno');
const mongodb = require('../../model/mongodb');

app.get('/user', async function (req, res) {
    try {
        res.json({ user: req.session.user });
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/user/new', async function (req, res) {
    try {
        const userName = req.body.userName;
        if (!userName || userName == '') return res.status(400).json({ message: 'Invalid Username' });
        const result = await mongodb.insertOne('players', { name: userName,createdAt:new Date() });
        const user = result.ops[0];
        req.session.user = user;
        res.json(req.session.user);
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
});

function checkSession(req, res, next) {
    if (req.session.user == null) { return res.status(400).json({ message: 'Unauthorized' }) }
    next();
}

app.post('/room/create', checkSession, async function (req, res) {
    try {
        const user = req.session.user;
        const insertObj = { roomName: req.body.roomName, createdBy: user, status: 'CREATED', players: [user], messages: [],createdAt:new Date() };
        const result = await mongodb.insertOne('rooms', insertObj);
        res.json({ _id: result.ops[0]._id });
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/room/join', checkSession, async function (req, res) {
    try {
        const result = await mongodb.findById('rooms', req.body.roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].players.filter(o => o._id == req.session.user._id).length) {
            return res.json({ message: 'Joined Already' });
        }
        if (result[0].status != 'CREATED') {
            return res.json({ message: 'Cannot join once game started. u can spectate or view results at any time' });
        }
        if (result[0].players.length > 10) {
            return res.json({ message: 'Cannot join once since room is full. u can spectate or view results at any time' });
        }
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(req.body.roomID) }, { $push: { players: req.session.user } });
        res.json({ message: 'Success' });
        io.emit(req.body.roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
});

app.get('/room/:id', checkSession, async function (req, res) {
    try {
        const result = await mongodb.findById('rooms', req.params.id);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        let room = result[0];
        room.myCards = room.playersCards ? room.playersCards[req.session.user._id] || [] : [];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
})

app.post('/room/:id/start', checkSession, unoRouter.startGame);
app.post('/room/:id/restart', checkSession, unoRouter.restart);
app.post('/room/:id/submit', checkSession, unoRouter.submitCard);
app.post('/room/:id/take', checkSession, unoRouter.takeCard);
app.post('/room/:id/pass', checkSession, unoRouter.passCard);

module.exports = app;