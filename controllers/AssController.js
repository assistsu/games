const shuffle = require('shuffle-array');
const _ = require('lodash');
const Ass = require('../utils/ass');
const common = require('../utils/common');
const mongodb = require('../model/mongodb');
const io = require('../model/io');
const CommonModel = require('../model/Common');

const collectionName = 'ass';
const cards = Ass.getCards();

function removePrivateFields(gameData, moreFields = []) {
    delete gameData.playersCards;
    delete gameData.games;
    delete gameData.rounds;
    moreFields.forEach(o => delete gameData[o]);
}

function preProcessGameData(gameData, $setObj = {}) {
    Object.assign(gameData, $setObj);
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
        let $setObj = { updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, {
            $push: { players: player, playersInGame: player },
            $set: $setObj
        });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_PLAYER_JOINED', gameData: { player: player, ...$setObj } });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function submitCard(req, res) {
    try {
        let { gameData, player, chosenCard, cardIndex } = req;
        let $setObj = {
            playersCards: gameData.playersCards,
            currentRoundPlayerCards: gameData.currentRoundPlayerCards,
            updatedAt: new Date(), updatedBy: player
        };
        let $pushObj = {};
        const currentRoundCards = Object.values(gameData.currentRoundPlayerCards);
        const isSameType = currentRoundCards.length && currentRoundCards[0].type == chosenCard.type;
        const isLastCard = currentRoundCards.length == gameData.playersInGame.length - 1;
        if (currentRoundCards.length == 0 || (isSameType && !isLastCard)) {
            $setObj.currentRoundPlayerCards[player._id] = chosenCard;
            $setObj.currentPlayer = common.getNextPlayer(gameData.playersInGame, player, 1);
        } else if (isSameType && isLastCard) {
            gameData.currentRoundPlayerCards[player._id] = chosenCard;
            currentRoundCards.push(chosenCard);
            $pushObj.rounds = { type: 'ALL_SUBMITTED', cards: currentRoundCards };
            $setObj.currentRoundPlayerCards = {};
            $setObj.currentPlayer = _.find(gameData.playersInGame, { _id: Ass.getPlayerWhoPutMaxCard(gameData.currentRoundPlayerCards) });
        }
        else {
            const isPlayerSpoofing = _.findIndex(gameData.playersCards[player._id], { type: currentRoundCards[0].type }) != -1;
            if (isPlayerSpoofing) return res.status(400).json({ message: 'Spoofing not allowed', errCode: 'PLAYER_SPOOFING' });
            const playerId = Ass.getPlayerWhoPutMaxCard(gameData.currentRoundPlayerCards);
            currentRoundCards.push(chosenCard);
            $pushObj.rounds = { type: 'HIT', playerGotHit: _.find(gameData.playersInGame, { _id: playerId }), hitBy: player, cards: currentRoundCards };
            gameData.playersCards[playerId] = gameData.playersCards[playerId].concat(currentRoundCards);
            $setObj.currentRoundPlayerCards = {};
            $setObj.currentPlayer = _.find(gameData.playersInGame, { _id: playerId });
        }
        $setObj.playersCards[player._id].splice(cardIndex, 1);
        if ($pushObj.rounds != null) {
            let isAnyAssPlayerDone = false;
            const donePlayers = gameData.playersInGame.filter(o => $setObj.playersCards[o._id].length == 0);
            donePlayers.map(o => {
                if ($setObj.playersCards[o._id].length) return;
                isAnyAssPlayerDone = true;
                delete $setObj.playersCards[o._id];
                gameData.playersInGame.splice(_.findIndex(gameData.playersInGame, { _id: o._id }), 1);
                if (gameData.assPlayers[o._id]) {
                    isAnyAssPlayerDone = true;
                    gameData.assPlayers[o._id]--;
                    if (gameData.assPlayers[o._id] == 0) {
                        delete gameData.assPlayers[o._id];
                    }
                }
            });
            if (donePlayers.length) {
                $setObj.playersInGame = gameData.playersInGame;
                if (isAnyAssPlayerDone) {
                    $setObj.assPlayers = gameData.assPlayers;
                }
            }
        }
        if (gameData.playersInGame.length == 1) {
            $setObj.status = 'ENDED';
            if (gameData.assPlayers[gameData.playersInGame[0]] == null)
                gameData.assPlayers[gameData.playersInGame[0]] = 0;
            gameData.assPlayers[gameData.playersInGame[0]]++;
            $setObj.assPlayers = gameData.assPlayers;
        }
        let updateObj = { $set: $setObj };
        if (Object.keys($pushObj).length) {
            updateObj.$push = $pushObj;
        }
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, updateObj);
        preProcessGameData($setObj, {
            playersInGame: gameData.playersInGame, players: gameData.players,
            lastRound: $pushObj.rounds, currentRoundPlayerCards: gameData.currentRoundPlayerCards
        });
        io.emit(req.params.id, { event: 'PLAYER_SUBMITTED_CARD', gameData: { ...$setObj } });
        $setObj.myCards = gameData.playersCards[player._id] || [];
        res.json($setObj);
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
                currentPlayer = _currentPlayer;
            }
            deck.splice(ind, 1);
            _currentPlayer = common.getNextPlayer(players, _currentPlayer, 1);
        }
        const $setObj = {
            status: 'STARTED', currentRoundPlayerCards: {}, playersCards, rounds: [], startedBy: player,
            escapedPlayers: [],
            currentPlayer,
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        preProcessGameData($setObj, { players: gameData.players, playersInGame: gameData.playersInGame });
        $setObj.myCards = playersCards[player._id];
        res.json($setObj);
        io.emit(req.params.id, { event: 'GAME_STARTED', gameData: _.pick($setObj, ['updatedAt', 'updatedBy']) });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function restart(req, res) {
    try {
        let { gameData, player } = req;
        const $setObj = { status: 'CREATED', playersInGame: gameData.players, assPlayers: {}, updatedAt: new Date(), updatedBy: player };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        CommonModel.storeEndedGameData(collectionName, _.assign(gameData, _.pick($setObj, ['updatedAt', 'updatedBy'])));
        res.json($setObj);
        io.emit(req.params.id, { event: 'GAME_RESTARTED', gameData: $setObj });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function leaveRoom(req, res) {
    try {
        let { gameData, player, playerIndex } = req;
        gameData.playersInGame.splice(playerIndex, 1);
        gameData.players.splice(_.findIndex(gameData.players, { _id: player._id }), 1);
        let $setObj = { assPlayers: {}, players: gameData.players, playersInGame: gameData.playersInGame, updatedAt: new Date(), updatedBy: player };
        if (gameData.players.length && gameData.admin._id == player._id) {
            $setObj.admin = gameData.players[common.randomNumber(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.players.length == 1) {
                $setObj.status = 'ENDED';
            }
            if (gameData.players.length > 1 && gameData.currentPlayer._id == player._id) {
                $setObj.currentPlayer = common.getNextPlayer(gameData.players, gameData.currentPlayer);
            }
        }
        let updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'PLAYER_LEFT_ROOM',
            gameData: { leftPlayerIndex: playerIndex, ..._.pick($setObj, ['updatedBy', 'updatedAt']) }
        });
    } catch (err) {
        common.serverError(req, res, err);
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
        // let $setObj = {};
        // $setObj[`playerNudged.${playerId}`] = new Date().getTime();
        // const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
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