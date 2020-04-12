var shuffle = require('shuffle-array');
const _ = require('lodash');
const Uno = require('../utils/uno');
const common = require('../utils/common');
const mongodb = require('../model/mongodb');

const cards = Uno.getCards();

function removePrivateFields(gameData, moreFields = []) {
    delete gameData.playersCards;
    delete gameData.deck;
    delete gameData.games;
    moreFields.forEach(o => delete gameData[o]);
}

function preProcessGameData(gameData, updateObj = {}) {
    gameData = Object.assign(gameData, updateObj);
    gameData.players = gameData.players.map(o => Object.assign(o, { cards: (gameData.playersCards[o._id] || []).length }));
    removePrivateFields(gameData);
}

async function getGameStatus(req, res) {
    try {
        let { gameData, player } = req;
        const myCards = gameData.playersCards[player._id] || [];
        preProcessGameData(gameData);
        gameData.myCards = myCards;
        res.json(gameData);
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function getCreataRoomInsertObj(roomName, player) {
    return {
        roomName: roomName,
        status: 'CREATED',
        players: [player],
        actions: [],
        messages: [],
        admin: player,
        games: [],
        playersCards: {},
        createdBy: player,
        createdAt: new Date(),
        updatedBy: player,
        updatedAt: new Date(),
    }
}

async function createRoom(req, res) {
    try {
        const insertObj = getCreataRoomInsertObj(req.body.roomName, req.player);
        const gameData = await mongodb.insertOne('uno', insertObj);
        res.json({ _id: gameData.ops[0]._id });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function joinRoom(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.players.length > 10) {
            return res.status(400).json({ message: 'Room is Full', errCode: 'ROOM_IS_FULL' });
        }
        let updateObj = { updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, {
            $push: { players: player },
            $set: updateObj
        });
        res.send();
        io.emit(req.params.id, { event: 'NEW_PLAYER_JOINED', gameData: { player: player, ...updateObj } });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function submitCard(req, res) {
    try {
        let { gameData, player } = req;
        const { chosenCard } = req.body;
        const cardIndex = _.findIndex(gameData.playersCards[player._id], { color: chosenCard.color, type: chosenCard.type });
        if (cardIndex == -1) {
            return res.status(400).json({ message: 'Chosen card not present in your deck', errCode: 'CHOSEN_CARD_NOT_PRESENT' });
        }
        let { lastCard, inc } = gameData;
        if (!Uno.isActionValid(lastCard, chosenCard)) {
            return res.status(400).json({ message: 'Chosen card does not match with last card', errCode: 'CHOSEN_CARD_NOT_MATCHED' });
        }
        if (chosenCard.type == Uno.card_types.REVERSE_CARD) {
            inc = -inc;
        }
        let nextPlayer = Uno.getNextPlayer(gameData.players, gameData.currentPlayer, inc);
        switch (chosenCard.type) {
            case Uno.card_types.WILD_CARD_DRAW_FOUR_CARDS:
                gameData.playersCards[nextPlayer._id] = gameData.playersCards[nextPlayer._id].concat(gameData.deck.splice(0, 2));
            case Uno.card_types.DRAW_TWO_CARDS:
                gameData.playersCards[nextPlayer._id] = gameData.playersCards[nextPlayer._id].concat(gameData.deck.splice(0, 2));
            case Uno.card_types.SKIP_CARD:
                nextPlayer = Uno.getNextPlayer(gameData.players, nextPlayer, inc);
                break;
        }
        gameData.deck.splice(common.randomNumber(0, gameData.deck.length - 1), 0, lastCard);
        gameData.playersCards[player._id].splice(cardIndex, 1);
        let updateObj = {
            lastLastCard: gameData.lastCard, lastCard: chosenCard, playersCards: gameData.playersCards, inc: inc,
            currentPlayer: nextPlayer, deck: gameData.deck,
            updatedAt: new Date(), updatedBy: player
        };
        switch (gameData.playersCards[player._id].length) {
            case 0:
                updateObj.status = 'ENDED';
                break;
            case 1:
                if (req.body.isUnoClicked != 'true') {
                    updateObj.playersCards[player._id] = updateObj.playersCards[player._id].concat(updateObj.deck.splice(0, 2));
                }
                break;
        }
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, { $set: updateObj });
        preProcessGameData(updateObj, { players: gameData.players });
        io.emit(req.params.id, { event: 'PLAYER_SUBMITTED_CARD', gameData: { ...updateObj } });
        updateObj.myCards = gameData.playersCards[player._id] || [];
        res.json(updateObj);
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function passCard(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.currentPlayer.pass != true) {
            return res.status(400).json({ message: 'Player can pass only when they take card from deck', errCode: 'PLAYER_CANT_PASS' });
        }
        let updateObj = {
            currentPlayer: Uno.getNextPlayer(gameData.players, gameData.currentPlayer, gameData.inc),
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, { $set: updateObj });
        res.json(updateObj);
        io.emit(req.params.id, { event: 'PLAYER_PASSED', gameData: updateObj });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function takeCard(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.currentPlayer.pass) {
            return res.status(400).json({ message: 'You have taken a card from deck already', errCode: 'PLAYER_TOOK_CARD_ALREADY' });
        }
        gameData.currentPlayer.pass = true;
        let updateObj = {
            playersCards: gameData.playersCards, currentPlayer: gameData.currentPlayer, deck: gameData.deck,
            updatedAt: new Date(), updatedBy: player
        };
        updateObj.playersCards[player._id].push(gameData.deck[0]);
        updateObj.deck.splice(0, 1);
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, { $set: updateObj });
        preProcessGameData(updateObj, { players: gameData.players });
        io.emit(req.params.id, { event: 'PLAYER_TOOK_CARD', gameData: { ...updateObj } });
        updateObj.myCards = gameData.playersCards[player._id] || [];
        res.json(updateObj);
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function startGame(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.players.length <= 1) {
            return res.status(400).json({ message: 'Atleast 2 players needed to start a game', errCode: 'CANT_START_GAME' });
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
        let playersCards = {}, players = shuffle(gameData.players, { 'copy': true });
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
        const updateObj = {
            players, status: 'STARTED', lastCard, playersCards, deck, startedBy: player,
            currentPlayer: players[common.randomNumber(0, players.length - 1)], inc: 1,
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, { $set: updateObj });
        preProcessGameData(updateObj);
        updateObj.myCards = gameData.playersCards[player._id] || [];
        res.json(updateObj);
        io.emit(req.params.id, { event: 'GAME_STARTED', gameData: _.pickBy(updateObj, ['updatedAt', 'updatedBy']) });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function restart(req, res) {
    try {
        let { gameData, player } = req;
        const updateObj = { status: 'CREATED', updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, { $set: updateObj, $push: { games: gameData } });
        res.json(updateObj);
        io.emit(req.params.id, { event: 'GAME_RESTARTED', gameData: updateObj });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function leaveRoom(req, res) {
    try {
        let { gameData, player, playerIndex } = req;
        gameData.players.splice(playerIndex, 1);
        let updateObj = { players: gameData.players, updatedAt: new Date(), updatedBy: player };
        if (gameData.players.length && gameData.admin._id == player._id) {
            updateObj.admin = gameData.players[common.randomNumber(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.players.length == 1) {
                updateObj.status = 'ENDED';
            }
            gameData.playersCards[player._id].forEach(card => {
                gameData.deck.splice(common.randomNumber(0, gameData.deck.length - 1), 0, card);
            });
            updateObj.deck = gameData.deck;
            if (gameData.players.length > 1 && gameData.currentPlayer._id == player._id) {
                updateObj.currentPlayer = Uno.getNextPlayer(gameData.players, gameData.currentPlayer);
            }
        }
        let updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId, "players._id": player._id }, { $set: updateObj });
        res.send();
        removePrivateFields(updateObj, ['players']);
        io.emit(req.params.id, { event: 'PLAYER_LEFT_ROOM', gameData: { ...updateObj, playerIndex: playerIndex } });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function newMessage(req, res) {
    try {
        const { text } = req.body;
        let { player } = req;
        const message = { text: text, ...player, createdAt: new Date() };
        const updatedGameData = await mongodb.updateOne('uno', { _id: req.roomObjectId }, { $push: { messages: message } });
        res.send();
        io.emit(req.params.id, { event: 'NEW_MESSAGE', gameData: { message: message } });
    } catch (err) {
        common.serverError(req, res, err);
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
    restart,
    leaveRoom,
    newMessage,
}