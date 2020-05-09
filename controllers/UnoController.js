const shuffle = require('shuffle-array');
const _ = require('lodash');
const UnoUtil = require('../utils/UnoUtil');
const CommonUtil = require('../utils/CommonUtil');
const ResponseUtil = require('../utils/ResponseUtil');
const mongodb = require('../model/mongodb');
const CommonModel = require('../model/Common');

const cards = UnoUtil.getCards();
const collectionName = "uno";

function removePrivateFields(gameData, moreFields = []) {
    delete gameData.playersCards;
    delete gameData.deck;
    moreFields.forEach(o => delete gameData[o]);
}

function preProcessGameData(gameData, $setObj = {}) {
    Object.assign(gameData, $setObj);
    gameData.players = gameData.players.map(o => Object.assign(o, { cardsCount: (gameData.playersCards[o._id] || []).length }));
    removePrivateFields(gameData);
}

function getGameStatus(req, res) {
    try {
        let { gameData, player } = req;
        const myCards = gameData.playersCards[player._id] || [];
        preProcessGameData(gameData);
        gameData.myCards = myCards;
        res.json(gameData);
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

function getCreataRoomInsertObj(roomName, player) {
    return {
        roomName: roomName,
        status: 'CREATED',
        players: [player],
        allJoinedPlayers: [player],
        actions: [],
        messages: [],
        admin: player,
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
        const gameData = await mongodb.insertOne(collectionName, insertObj);
        res.json({ _id: gameData.ops[0]._id });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function joinRoom(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.players.length >= 10) {
            return res.status(400).json({ message: 'Room is Full', errCode: 'ROOM_IS_FULL' });
        }
        let $setObj = { updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, {
            $push: { players: player, allJoinedPlayers: player },
            $set: $setObj
        });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_PLAYER_JOINED', gameData: { player: player, ...$setObj } });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
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
        if (!UnoUtil.isActionValid(lastCard, chosenCard)) {
            return res.status(400).json({ message: 'Chosen card does not match with last card', errCode: 'CHOSEN_CARD_NOT_MATCHED' });
        }
        if (chosenCard.type == UnoUtil.card_types.REVERSE_CARD) {
            inc = -inc;
        }
        let nextPlayer = CommonUtil.getNextPlayer(gameData.players, gameData.currentPlayer, inc);
        switch (chosenCard.type) {
            case UnoUtil.card_types.WILD_CARD_DRAW_FOUR_CARDS:
                gameData.playersCards[nextPlayer._id] = gameData.playersCards[nextPlayer._id].concat(gameData.deck.splice(0, 2));
            case UnoUtil.card_types.DRAW_TWO_CARDS:
                gameData.playersCards[nextPlayer._id] = gameData.playersCards[nextPlayer._id].concat(gameData.deck.splice(0, 2));
            case UnoUtil.card_types.SKIP_CARD:
                nextPlayer = CommonUtil.getNextPlayer(gameData.players, nextPlayer, inc);
                break;
        }
        gameData.deck.splice(CommonUtil.randomNumber(0, gameData.deck.length - 1), 0, lastCard);
        gameData.playersCards[player._id].splice(cardIndex, 1);
        let $setObj = {
            lastLastCard: gameData.lastCard, lastCard: chosenCard, playersCards: gameData.playersCards, inc: inc,
            currentPlayer: nextPlayer, deck: gameData.deck,
            updatedAt: new Date(), updatedBy: player
        };
        switch (gameData.playersCards[player._id].length) {
            case 0:
                $setObj.status = 'ENDED';
                break;
            case 1:
                if (req.body.isUnoClicked != 'true') {
                    $setObj.playersCards[player._id] = $setObj.playersCards[player._id].concat($setObj.deck.splice(0, 2));
                }
                break;
        }
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        preProcessGameData($setObj, { players: gameData.players });
        io.emit(req.params.id, { event: 'PLAYER_SUBMITTED_CARD', gameData: { ...$setObj } });
        $setObj.myCards = gameData.playersCards[player._id] || [];
        res.json($setObj);
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function passCard(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.currentPlayer.pass != true) {
            return res.status(400).json({ message: 'Player can pass only when they take card from deck', errCode: 'PLAYER_CANT_PASS' });
        }
        let $setObj = {
            currentPlayer: CommonUtil.getNextPlayer(gameData.players, gameData.currentPlayer, gameData.inc),
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.json($setObj);
        io.emit(req.params.id, { event: 'PLAYER_PASSED', gameData: $setObj });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function takeCard(req, res) {
    try {
        let { gameData, player } = req;
        if (gameData.currentPlayer.pass) {
            return res.status(400).json({ message: 'You have taken a card from deck already', errCode: 'PLAYER_TOOK_CARD_ALREADY' });
        }
        gameData.currentPlayer.pass = true;
        let $setObj = {
            playersCards: gameData.playersCards, currentPlayer: gameData.currentPlayer, deck: gameData.deck,
            updatedAt: new Date(), updatedBy: player
        };
        $setObj.playersCards[player._id].push(gameData.deck[0]);
        $setObj.deck.splice(0, 1);
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        preProcessGameData($setObj, { players: gameData.players });
        io.emit(req.params.id, { event: 'PLAYER_TOOK_CARD', gameData: { ...$setObj } });
        $setObj.myCards = gameData.playersCards[player._id] || [];
        res.json($setObj);
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
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
            const num = CommonUtil.randomNumber(0, deck.length);
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
                const num = CommonUtil.randomNumber(0, deck.length);
                const card = deck[num];
                playersCards[playerId].push(card);
                deck.splice(num, 1);
            }
        }
        const $setObj = {
            players, status: 'STARTED', lastCard, playersCards, deck, startedBy: player,
            currentPlayer: players[CommonUtil.randomNumber(0, players.length - 1)], inc: 1,
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        preProcessGameData($setObj);
        $setObj.myCards = playersCards[player._id] || [];
        res.json($setObj);
        io.emit(req.params.id, { event: 'GAME_STARTED', gameData: _.pick($setObj, ['updatedAt', 'updatedBy']) });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function restart(req, res) {
    try {
        let { gameData, player } = req;
        const $setObj = { status: 'CREATED', updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        CommonModel.storeEndedGameData(collectionName, _.assign(gameData, _.pick($setObj, ['updatedAt', 'updatedBy'])));
        res.json($setObj);
        io.emit(req.params.id, { event: 'GAME_RESTARTED', gameData: $setObj });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function leaveRoom(req, res) {
    try {
        let { gameData, player, playerIndex } = req;
        gameData.players.splice(playerIndex, 1);
        let $setObj = { players: gameData.players, updatedAt: new Date(), updatedBy: player };
        if (gameData.players.length && gameData.admin._id == player._id) {
            $setObj.admin = gameData.players[CommonUtil.randomNumber(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.players.length == 1) {
                $setObj.status = 'ENDED';
            }
            gameData.playersCards[player._id].forEach(card => {
                gameData.deck.splice(CommonUtil.randomNumber(0, gameData.deck.length - 1), 0, card);
            });
            $setObj.deck = gameData.deck;
            if (gameData.players.length > 1 && gameData.currentPlayer._id == player._id) {
                $setObj.currentPlayer = CommonUtil.getNextPlayer(gameData.players, gameData.currentPlayer);
            }
        }
        let updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'PLAYER_LEFT_ROOM',
            gameData: { leftPlayerIndex: playerIndex, ..._.pick($setObj, ['updatedBy', 'updatedAt']) }
        });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function newMessage(req, res) {
    try {
        const { text } = req.body;
        let { player } = req;
        const message = { text: text, ...player, createdAt: new Date() };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $push: { messages: message } });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_MESSAGE', gameData: { message: message } });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

async function nudgePlayer(req, res) {
    try {
        const { playerId } = req.body;
        if (req.player._id == playerId) return res.status(400).json({ message: 'You cannot nudge yourself', errCode: 'NUDGING_HIMSELF' });
        if (_.findIndex(req.gameData.players, { _id: playerId }) == -1) return res.status(400).json({ message: 'The player you are nudging not in your room', errCode: 'NUDGE_PLAYER_NOT_IN_ROOM' });
        // if (req.gameData.playerNudged && req.gameData.playerNudged[playerId]) {
        //     const diff = new Date().getTime() - req.gameData.playerNudged[playerId];
        //     if (diff < 3000) {
        //         return res.status(400).json({ message: 'Player already nudged', errCode: 'PLAYER_NUDGED_ALREADY' });
        //     }
        // }
        // let $setObj = {};
        // $setObj[`playerNudged.${playerId}`] = new Date().getTime();
        // const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(playerId, { event: 'NUDGED', nudgedBy: req.player });
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
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
    nudgePlayer
}