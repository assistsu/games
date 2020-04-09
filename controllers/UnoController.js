var shuffle = require('shuffle-array')
const Uno = require('../utils/uno');
const common = require('../utils/common');
const mongodb = require('../model/mongodb');
const _ = require('lodash');

const cards = Uno.getCards();

async function getGameStatus(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'ROOM_NOT_FOUND' });
        }
        let room = roomData[0];
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
        const player = _.pick(req.player, ['_id', 'name']);
        const insertObj = { roomName: req.body.roomName, createdBy: player, updatedBy: player, status: 'CREATED', players: [player], messages: [], createdAt: new Date(), updatedAt: new Date(), games: [] };
        const roomData = await mongodb.insertOne('uno', insertObj);
        res.json({ _id: roomData.ops[0]._id });
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function joinRoom(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (roomData[0].players.filter(o => o._id == req.player._id).length) {
            return res.json({ message: 'Joined Already' });
        }
        if (roomData[0].status != 'CREATED') {
            return res.json({ message: 'Cannot join once game started. u can spectate or view results at any time' });
        }
        if (roomData[0].players.length > 10) {
            return res.json({ message: 'Cannot join once since room is full. u can spectate or view results at any time' });
        }
        const player = _.pick(req.player, ['_id', 'name']);
        const finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID) }, { $push: { players: player }, $set: { updatedAt: new Date(), updatedBy: player } });
        res.json({ message: 'Success' });
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function submitCard(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (roomData[0].status != 'STARTED') {
            return res.status(400).json({ message: 'Cant submit a card on ended match' });
        }
        if (roomData[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot submit card without joining game' });
        }
        if (roomData[0].currentPlayer._id != req.player._id) {
            return res.status(400).json({ message: 'Player can take action only on their turn' });
        }
        const { chosenCard } = req.body;
        const cardIndex = _.findIndex(roomData[0].playersCards[req.player._id], { color: chosenCard.color, type: chosenCard.type });
        if (cardIndex == -1) {
            return res.status(400).json({ message: 'Chosen card not present in your deck' });
        }
        let { lastCard, inc } = roomData[0];
        if (!Uno.isActionValid(lastCard, chosenCard)) {
            return res.status(400).json({ message: 'Chosen card does not match with last card' });
        }
        if (chosenCard.type == Uno.card_types.REVERSE_CARD) {
            inc = -inc;
        }
        let nextPlayer = Uno.getNextPlayer(roomData[0].players, roomData[0].currentPlayer, inc);
        switch (chosenCard.type) {
            case Uno.card_types.WILD_CARD_DRAW_FOUR_CARDS:
                roomData[0].playersCards[nextPlayer._id] = roomData[0].playersCards[nextPlayer._id].concat(roomData[0].deck.splice(0, 2));
            case Uno.card_types.DRAW_TWO_CARDS:
                roomData[0].playersCards[nextPlayer._id] = roomData[0].playersCards[nextPlayer._id].concat(roomData[0].deck.splice(0, 2));
            case Uno.card_types.SKIP_CARD:
                nextPlayer = Uno.getNextPlayer(roomData[0].players, nextPlayer, inc);
                break;
        }
        roomData[0].deck.splice(common.randomNumber(0, roomData[0].deck.length - 1), 0, lastCard);
        roomData[0].playersCards[req.player._id].splice(cardIndex, 1);
        let updateObj = { lastCard: chosenCard, playersCards: roomData[0].playersCards, inc: inc, currentPlayer: nextPlayer, deck: roomData[0].deck };
        switch (roomData[0].playersCards[req.player._id].length) {
            case 0:
                updateObj.status = 'ENDED';
                break;
            case 1:
                if (req.body.isUnoClicked != 'true') {
                    updateObj.playersCards[req.player._id] = updateObj.playersCards[req.player._id].concat(updateObj.deck.splice(0, 2));
                }
                break;
        }
        const finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        req.room = Object.assign(roomData[0], updateObj);
        next();
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function passCard(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (roomData[0].status != 'STARTED') {
            return res.status(400).json({ message: 'Cant take a card on ended match' });
        }
        if (roomData[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot take card without joining game' });
        }
        if (roomData[0].currentPlayer._id != req.player._id) {
            return res.status(400).json({ message: 'Player can take action only on their turn' });
        }
        if (roomData[0].currentPlayer.pass != true) {
            return res.status(400).json({ message: 'Player can pass only when they take card from deck' });
        }
        let updateObj = { currentPlayer: Uno.getNextPlayer(roomData[0].players, roomData[0].currentPlayer, roomData[0].inc) };
        const finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        req.room = Object.assign(roomData[0], updateObj);
        next();
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function takeCard(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (roomData[0].status != 'STARTED') {
            return res.status(400).json({ message: 'Cant take a card on ended match' });
        }
        if (roomData[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot take card without joining game' });
        }
        if (roomData[0].currentPlayer._id != req.player._id) {
            return res.status(400).json({ message: 'Player can take action only on their turn' });
        }
        if (roomData[0].currentPlayer.pass) {
            return res.status(400).json({ message: 'You have taken a card from deck already' });
        }
        let updateObj = { playersCards: roomData[0].playersCards, currentPlayer: roomData[0].currentPlayer, deck: roomData[0].deck };
        updateObj.playersCards[req.player._id].push(roomData[0].deck[0]);
        updateObj.deck.splice(0, 1);
        updateObj.currentPlayer.pass = true;
        const finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        req.room = Object.assign(roomData[0], updateObj);
        next();
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function startGame(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (roomData[0].status != 'CREATED') {
            return res.status(400).json({ message: 'Cant start a match again' });
        }
        if (roomData[0].players.length <= 1) {
            return res.status(400).json({ message: 'Atleast 2 players needed to start a game' });
        }
        if (roomData[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot start without joining game' });
        }
        const deck = shuffle(cards, { 'copy': true });
        let lastCard = null;
        while (!lastCard) {
            const num = common.randomNumber(0, deck.length);
            const card = deck[num];
            if (card.type.match(/[0-9]/) == null) continue;
            lastCard = card;
            deck.splice(num, 1);
        }
        let playersCards = {}, players = roomData[0].players;
        for (let i = 0; i < players.length; i++) {
            const playerId = players[i]._id;
            playersCards[playerId] = [];
            for (let j = 0; j < 7; j++) {
                const num = common.randomNumber(0, deck.length);
                const card = deck[num];
                playersCards[playerId].push(card);
                deck.splice(num, 1);
            }
        }
        const updateObj = { status: 'STARTED', lastCard, playersCards, deck, startedBy: req.player, currentPlayer: players[common.randomNumber(0, players.length - 1)], inc: 1 };
        const finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player } });
        req.room = Object.assign(roomData[0], updateObj);
        next();
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function restart(req, res, next) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (roomData[0].status != 'ENDED') {
            return res.status(400).json({ message: 'Cant restart unless match ends' });
        }
        if (roomData[0].players.filter(o => o._id == req.player._id).length == 0) {
            return res.status(400).json({ message: 'Player cannot restart unless player present in game' });
        }
        const updateObj = { status: 'CREATED' };
        const finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID) }, { $set: { ...updateObj, updatedAt: new Date(), updatedBy: req.player }, $push: { games: roomData[0] } });
        req.room = Object.assign(roomData[0], updateObj);
        next();
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

async function leaveRoom(req, res) {
    try {
        const roomID = req.params.id;
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const roomData = await mongodb.findById('uno', roomID);
        if (roomData.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        const playerIndex = _.findIndex(roomData[0].players, { _id: req.player._id });
        if (playerIndex == -1) {
            return res.status(400).json({ message: 'Player cannot leave unless player present in game' });
        }
        roomData[0].players.splice(playerIndex, 1);
        let updateObj = { players: roomData[0].players };
        if (roomData[0].status == 'STARTED') {
            if (roomData[0].players.length == 1) {
                updateObj.status = 'ENDED';
            }
            roomData[0].playersCards[req.player._id].forEach(card => {
                roomData[0].deck.splice(common.randomNumber(0, roomData[0].deck.length - 1), 0, card);
            });
            updateObj.deck = roomData[0].deck;
            if (roomData[0].currentPlayer._id == req.player._id) {
                updateObj.currentPlayer = Uno.getNextPlayer(up);
            }
        }
        let finalResult = await mongodb.updateOne('uno', { _id: mongodb.getId(roomID), "players._id": req.player._id }, { $set: updateObj });
        res.json({ message: 'success' });
        io.emit(roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}

function removeProtectedFields(req, res) {
    let { room } = req;
    room.myCards = room.playersCards[req.player._id];
    if (room.playersCards)
        room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
    delete room.playersCards;
    delete room.deck;
    delete room.games;
    io.emit(room._id, 'some event');
    res.json(room);
}

module.exports = {
    getGameStatus,
    createRoom,
    joinRoom,
    submitCard,
    passCard,
    takeCard,
    startGame,
    restart,
    removeProtectedFields,
    leaveRoom,
}