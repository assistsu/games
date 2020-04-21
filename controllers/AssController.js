const shuffle = require('shuffle-array');
const _ = require('lodash');
const Ass = require('../utils/ass');
const common = require('../utils/common');
const mongodb = require('../model/mongodb');

const collectionName = 'ass';
const cards = Ass.getCards();

function removePrivateFields(gameData, moreFields = []) {
    delete gameData.playersCards;
    delete gameData.deck;
    delete gameData.games;
    delete gameData.rounds;
    moreFields.forEach(o => delete gameData[o]);
}

function preProcessGameData(gameData, updateObj = {}) {
    Object.assign(gameData, updateObj);
    gameData.playersInGame = gameData.playersInGame.map(o => Object.assign(o, { cards: (gameData.playersCards[o._id] || []).length }));
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
        common.serverError(req, res, err);
    }
}

function getCreataRoomInsertObj(roomName, player) {
    return {
        roomName: roomName,
        status: 'CREATED',
        players: [player],
        playersInGame: [player],
        actions: [],
        messages: [],
        admin: player,
        games: [],
        playersCards: {},
        assPlayers: {},
        playerNudged: {},
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
        common.serverError(req, res, err);
    }
}

async function joinRoom(req, res) {
    try {
        let { player } = req;
        let updateObj = { updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, {
            $push: { players: player, playersInGame: player },
            $set: updateObj
        });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_PLAYER_JOINED', gameData: { player: player, ...updateObj } });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function submitCard(req, res) {
    try {
        let { gameData, player, playerIndex, chosenCard } = req;
        let updateObj = {
            playersCards: gameData.playersCards,
            currentRoundPlayerCards: gameData.currentRoundPlayerCards,
            updatedAt: new Date(), updatedBy: player
        };
        let $pushObj = {};
        const currentRoundCards = Object.values(gameData.currentRoundPlayerCards);
        const isSameType = currentRoundCards.length && currentRoundCards[0].type == chosenCard.type;
        const isLastCard = currentRoundCards.length == gameData.playersInGame.length - 1;
        if (currentRoundCards.length == 0 || (isSameType && !isLastCard)) {
            gameData.currentRoundPlayerCards[player._id] = chosenCard;
            updateObj.currentRoundPlayerCards = gameData.currentRoundPlayerCards;
            updateObj.currentPlayer = common.getNextPlayer(gameData.playersInGame, player, 1);
        } else if (isSameType && isLastCard) {
            gameData.currentRoundPlayerCards[player._id] = chosenCard;
            currentRoundCards.push(chosenCard);
            $pushObj.rounds = { type: 'ALL_SUBMITTED', cards: currentRoundCards };
            updateObj.currentRoundPlayerCards = {};
            updateObj.currentPlayer = _.find(gameData.playersInGame, { _id: Ass.getPlayerWhoPutMaxCard(gameData.currentRoundPlayerCards) });
        }
        else {
            const isPlayerSpoofing = _.findIndex(gameData.playersCards[player._id], { type: currentRoundCards[0].type }) != -1;
            if (isPlayerSpoofing) return res.status(400).json({ message: 'Spoofing not allowed', errCode: 'PLAYER_SPOOFING' });
            const playerId = Ass.getPlayerWhoPutMaxCard(gameData.currentRoundPlayerCards);
            currentRoundCards.push(chosenCard);
            $pushObj.rounds = { type: 'HIT', playerGotHit: _.find(gameData.playersInGame, { _id: playerId }), hitBy: player, cards: currentRoundCards };
            gameData.playersCards[playerId] = gameData.playersCards[playerId].concat(currentRoundCards);
            updateObj.currentRoundPlayerCards = {};
            updateObj.currentPlayer = _.find(gameData.playersInGame, { _id: playerId });
        }
        updateObj.playersCards[player._id].splice(req.cardIndex, 1);
        if (updateObj.playersCards[player._id].length == 0 && updateObj.currentPlayer._id != player._id) {
            delete updateObj.playersCards[player._id];
            gameData.playersInGame.splice(playerIndex, 1);
            updateObj.playersInGame = gameData.playersInGame;
            if (gameData.assPlayers[player._id]) {
                gameData.assPlayers[player._id]--;
                if (gameData.assPlayers[player._id] == 0) {
                    delete gameData.assPlayers[player._id];
                }
                updateObj.assPlayers = gameData.assPlayers;
            }
        }
        if (gameData.playersInGame.length == 1) {
            updateObj.status = 'ENDED';
            if (gameData.assPlayers[gameData.playersInGame[0]] == null)
                gameData.assPlayers[gameData.playersInGame[0]] = 0;
            gameData.assPlayers[gameData.playersInGame[0]]++;
            updateObj.assPlayers = gameData.assPlayers;
        }
        const updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, { $set: updateObj });
        preProcessGameData(updateObj, {
            playersInGame: gameData.playersInGame, players: gameData.players,
            lastRound: $pushObj.rounds, currentRoundPlayerCards: gameData.currentRoundPlayerCards
        });
        io.emit(req.params.id, { event: 'PLAYER_SUBMITTED_CARD', gameData: { ...updateObj } });
        updateObj.myCards = gameData.playersCards[player._id] || [];
        res.json(updateObj);
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function startGame(req, res) {
    try {
        let { gameData, player } = req;
        const deck = shuffle(cards, { 'copy': true });
        let playersCards = {}, players = shuffle(gameData.players, { 'copy': true });
        let _currentPlayer = players[common.randomNumber(0, players.length - 1)];
        let currentPlayer;
        for (let i = 0; i < 52; i++) {
            if (playersCards[_currentPlayer._id] == null) { playersCards[_currentPlayer._id] = [] }
            const ind = common.randomNumber(0, deck.length - 1);
            playersCards[_currentPlayer._id].push(deck[ind]);
            if (deck[ind].type == 'SPADE' && deck[ind].number == 14) {
                console.log(deck[ind], _currentPlayer);
                currentPlayer = _currentPlayer;
            }
            deck.splice(ind, 1);
            _currentPlayer = common.getNextPlayer(players, _currentPlayer, 1);
        }
        const updateObj = {
            status: 'STARTED', currentRoundPlayerCards: {}, playersCards, rounds: [], startedBy: player,
            escapedPlayers: [],
            currentPlayer,
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, { $set: updateObj });
        preProcessGameData(updateObj, { players: gameData.players, playersInGame: gameData.playersInGame });
        updateObj.myCards = playersCards[player._id];
        res.json(updateObj);
        io.emit(req.params.id, { event: 'GAME_STARTED', gameData: _.pick(updateObj, ['updatedAt', 'updatedBy']) });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function restart(req, res) {
    try {
        let { gameData, player } = req;
        const updateObj = { status: 'CREATED', playersInGame: gameData.players, assPlayers: {}, updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, { $set: updateObj, $push: { games: gameData } });
        res.json(updateObj);
        io.emit(req.params.id, { event: 'GAME_RESTARTED', gameData: updateObj });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function leaveRoom(req, res) {
    try {
        let { gameData, player, playerIndex } = req;
        gameData.playersInGame.splice(playerIndex, 1);
        gameData.players.splice(_.findIndex(gameData.players, { _id: player._id }), 1);
        let updateObj = { assPlayers: {}, players: gameData.players, playersInGame: gameData.playersInGame, updatedAt: new Date(), updatedBy: player };
        if (gameData.players.length && gameData.admin._id == player._id) {
            updateObj.admin = gameData.players[common.randomNumber(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.players.length == 1) {
                updateObj.status = 'ENDED';
            }
            updateObj.deck = gameData.deck;
            if (gameData.players.length > 1 && gameData.currentPlayer._id == player._id) {
                updateObj.currentPlayer = common.getNextPlayer(gameData.players, gameData.currentPlayer);
            }
        }
        let updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, { $set: updateObj });
        res.sendStatus(200);
        removePrivateFields(updateObj, ['players']);
        io.emit(req.params.id, { event: 'PLAYER_LEFT_ROOM', gameData: { ...updateObj, leftPlayer: player } });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function newMessage(req, res) {
    try {
        const { text } = req.body;
        let { player } = req;
        const message = { text: text, ...player, createdAt: new Date() };
        const updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, { $push: { messages: message } });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_MESSAGE', gameData: { message: message } });
    } catch (err) {
        common.serverError(req, res, err);
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
        // let updateObj = {};
        // updateObj[`playerNudged.${playerId}`] = new Date().getTime();
        // const updatedGameData = await mongodb.updateOneById(collectionName, req.roomObjectId, { $set: updateObj });
        res.sendStatus(200);
        io.emit(playerId, { event: 'NUDGED', nudgedBy: req.player });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

module.exports = {
    getGameStatus,
    createRoom,
    joinRoom,
    submitCard,
    startGame,
    restart,
    leaveRoom,
    newMessage,
    nudgePlayer
}