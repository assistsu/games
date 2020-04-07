var shuffle = require('shuffle-array')
const Uno = require('../utils/Uno');
const Common = require('../utils/Common');
const mongodb = require('../model/mongodb');
const _ = require('lodash');

const cards = Uno.getCards();

async function getGameStatus(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'ROOM_NOT_FOUND' });
        }
        let room = result[0];
        room.myCards = room.playersCards ? room.playersCards[req.player._id] || [] : [];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function createRoom(req, res) {
    try {
        const user = req.player;
        const insertObj = { roomName: req.body.roomName, createdBy: user, status: 'CREATED', players: [user], messages: [], createdAt: new Date() };
        const result = await mongodb.insertOne('rooms', insertObj);
        res.json({ _id: result.ops[0]._id });
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function joinRoom(req, res) {
    try {
        const { roomID } = req.body;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].players.filter(o => o._id == req.player._id).length) {
            return res.json({ message: 'Joined Already' });
        }
        if (result[0].status != 'CREATED') {
            return res.json({ message: 'Cannot join once game started. u can spectate or view results at any time' });
        }
        if (result[0].players.length > 10) {
            return res.json({ message: 'Cannot join once since room is full. u can spectate or view results at any time' });
        }
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $push: { players: req.player }, $set: { updatedAt: new Date(), updatedBy: req.player } });
        res.json({ message: 'Success' });
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function submitCard(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].status != 'STARTED') {
            return res.status(400).json({ message: 'Cant submit a card on ended match' });
        }
        if (result[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot submit card without joining game' });
        }
        if (result[0].currentPlayer._id != req.player._id) {
            return res.status(400).json({ message: 'Player can take action only on their turn' });
        }
        const { chosenCard } = req.body;
        const cardIndex = _.findIndex(result[0].playersCards[req.player._id], { color: chosenCard.color, type: chosenCard.type });
        if (cardIndex == -1) {
            return res.status(400).json({ message: 'Chosen card not present in your deck' });
        }
        let { lastCard, inc } = result[0];
        if (!Uno.isActionValid(lastCard, chosenCard)) {
            return res.status(400).json({ message: 'Chosen card does not match with last card' });
        }
        if (chosenCard.type == Uno.card_types.REVERSE_CARD) {
            inc = -inc;
        }
        let nextPlayer = Uno.getNextPlayer(result[0].players, result[0].currentPlayer, inc);
        switch (chosenCard.type) {
            case Uno.card_types.WILD_CARD_DRAW_FOUR_CARDS:
                result[0].playersCards[nextPlayer._id] = result[0].playersCards[nextPlayer._id].concat(result[0].deck.splice(0, 2));
            case Uno.card_types.DRAW_TWO_CARDS:
                result[0].playersCards[nextPlayer._id] = result[0].playersCards[nextPlayer._id].concat(result[0].deck.splice(0, 2));
            case Uno.card_types.SKIP_CARD:
                nextPlayer = Uno.getNextPlayer(result[0].players, nextPlayer, inc);
                break;
        }
        result[0].deck.splice(Common.randomNumber(0, result[0].deck.length - 1), 0, lastCard);
        result[0].playersCards[req.player._id].splice(cardIndex, 1);
        let updateObj = { lastCard: chosenCard, playersCards: result[0].playersCards, inc: inc, currentPlayer: nextPlayer, deck: result[0].deck };
        switch (result[0].playersCards[req.player._id].length) {
            case 0: updateObj.status = 'ENDED'; break;
            case 1:
                if (req.body.unoStatus != 'true') {
                    updateObj.playersCards[req.player._id] = updateObj.playersCards[req.player._id].concat(updateObj.deck.splice(0, 2));
                }
                break;
        }
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        let room = Object.assign(result[0], updateObj);
        room.myCards = room.playersCards[req.player._id];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function passCard(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].status != 'STARTED') {
            return res.status(400).json({ message: 'Cant take a card on ended match' });
        }
        if (result[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot take card without joining game' });
        }
        if (result[0].currentPlayer._id != req.player._id) {
            return res.status(400).json({ message: 'Player can take action only on their turn' });
        }
        if (result[0].currentPlayer.pass != true) {
            return res.status(400).json({ message: 'Player can pass only when they take card from deck' });
        }
        let updateObj = { currentPlayer: Uno.getNextPlayer(result[0].players, result[0].currentPlayer, result[0].inc) };
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        let room = Object.assign(result[0], updateObj);
        room.myCards = room.playersCards[req.player._id];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function takeCard(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].status != 'STARTED') {
            return res.status(400).json({ message: 'Cant take a card on ended match' });
        }
        if (result[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot take card without joining game' });
        }
        if (result[0].currentPlayer._id != req.player._id) {
            return res.status(400).json({ message: 'Player can take action only on their turn' });
        }
        if (result[0].currentPlayer.pass) {
            return res.status(400).json({ message: 'You have taken a card from deck already' });
        }
        let updateObj = { playersCards: result[0].playersCards, currentPlayer: result[0].currentPlayer, deck: result[0].deck };
        updateObj.playersCards[req.player._id].push(result[0].deck[0]);
        updateObj.deck.splice(0, 1);
        updateObj.currentPlayer.pass = true;
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        let room = Object.assign(result[0], updateObj);
        room.myCards = room.playersCards[req.player._id];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function startGame(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].status != 'CREATED') {
            return res.status(400).json({ message: 'Cant start a match again' });
        }
        if (result[0].players.length <= 1) {
            return res.status(400).json({ message: 'Atleast 2 players needed to start a game' });
        }
        if (result[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot start without joining game' });
        }
        const deck = shuffle(cards, { 'copy': true });
        let lastCard = null;
        while (!lastCard) {
            const num = Common.randomNumber(0, deck.length);
            const card = deck[num];
            if (card.type.match(/[0-9]/) == null) continue;
            lastCard = card;
            deck.splice(num, 1);
        }
        let playersCards = {}, players = result[0].players;
        for (let i = 0; i < players.length; i++) {
            const playerId = players[i]._id;
            playersCards[playerId] = [];
            for (let j = 0; j < 7; j++) {
                const num = Common.randomNumber(0, deck.length);
                const card = deck[num];
                playersCards[playerId].push(card);
                deck.splice(num, 1);
            }
        }
        const updateObj = { status: 'STARTED', lastCard, playersCards, deck, startedBy: req.player, currentPlayer: players[Common.randomNumber(0, players.length - 1)], inc: 1 };
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        let room = Object.assign(result[0], updateObj);
        room.myCards = room.playersCards[req.player._id];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function restart(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].status != 'ENDED') {
            return res.status(400).json({ message: 'Cant restart unless match ends' });
        }
        if (result[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot restart unless player present in game' });
        }
        const updateObj = { status: 'CREATED' };
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player }, $push: { games: result[0] } });
        let room = Object.assign(result[0], updateObj);
        room.myCards = room.playersCards[req.player._id];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getGameStatus,
    createRoom,
    joinRoom,
    submitCard,
    passCard,
    takeCard,
    startGame,
    restart
}