const shuffle = require('shuffle-array');
const _ = require('lodash');
const LeastCountUtil = require('../utils/LeastCount');
const common = require('../utils/common');
const mongodb = require('../model/mongodb');
const CommonModel = require('../model/Common');

const cards = LeastCountUtil.getCards();
const collectionName = 'leastcount';

function getPublicFields(gameData) {
    return _.pick(gameData, [
        'roomName',
        'status',
        'players',
        'actions',
        'messages',
        'admin',
        'lastCards',
        'playersTotalPoints',
        'currentPlayer',
        'currentPlayerAction',
        'currentPlayerDroppedCards',
        'createdBy',
        'createdAt',
        'updatedBy',
        'updatedAt',
    ]);
}

function computePlayersCardsCount(players, playersCards) {
    players.forEach(o => { o.cardsCount = (playersCards[o._id] || []).length });
}

function getPublicFieldsWithPlayersCardsCount(gameData) {
    computePlayersCardsCount(gameData.players, gameData.playersCards);
    return getPublicFields(gameData);
}

function addPlayerData(obj, playersCards, playersPoints, playerId) {
    _.assign(obj, { myCards: playersCards ? playersCards[playerId] : [], myPoints: playersPoints ? playersPoints[playerId] : 0 });
}

function getGameInfoForPlayer(gameData, playerId) {
    let obj = getPublicFieldsWithPlayersCardsCount(gameData);
    addPlayerData(obj, gameData.playersCards, gameData.playersPoints, playerId);
    return obj;
}

function getGameStatus(req, res) {
    try {
        let { gameData, player } = req;
        res.json(getGameInfoForPlayer(gameData, player._id));
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
        playersCards: {},
        playersPoints: {},
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
            $push: { players: player },
            $set: $setObj
        });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'NEW_PLAYER_JOINED',
            gameData: _.assign($setObj, { player: player })
        });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function submitCard(req, res) {
    try {
        let { gameData, player, chosenCards, cardsIndex } = req;
        let $setObj = {
            currentPlayerAction: 'TAKE',
            currentPlayerDroppedCards: chosenCards,
            updatedAt: new Date(), updatedBy: player,
        };
        _.pullAt(gameData.playersCards[player._id], cardsIndex);
        let myCards = gameData.playersCards[player._id];
        let myPoints = gameData.playersPoints[player._id] - _.sumBy(chosenCards, o => _.find(cards, o).point);
        $setObj[`playersCards.${player._id}`] = myCards;
        $setObj[`playersPoints.${player._id}`] = myPoints;
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'PLAYER_SUBMITTED_CARD',
            gameData: _.assign($setObj, {
                player: _.assign(req.player, { cardsCount: myCards.length }),
                playerDroppedCards: chosenCards,
            })
        });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function takeCard(req, res) {
    try {
        let { gameData, player } = req;
        let $setObj = {
            currentPlayerAction: 'TOOK',
            updatedAt: new Date(), updatedBy: player
        };
        let takenCard;
        switch (req.body.takeFrom) {
            case 'DECK':
                takenCard = gameData.deck.splice(0, 1)[0];
                $setObj.deck = gameData.deck;
                break;
            case 'LASTCARD':
                takenCard = gameData.lastCards.splice(0, 1)[0];
                $setObj.lastCards = gameData.lastCards;
                break;
        }
        gameData.playersCards[player._id].push(takenCard);
        gameData.playersPoints[player._id] += _.find(cards, takenCard).point;
        $setObj[`playersCards.${player._id}`] = gameData.playersCards[player._id];
        $setObj[`playersPoints.${player._id}`] = gameData.playersPoints[player._id];
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'PLAYER_TOOK_CARD',
            gameData: _.assign($setObj, {
                player: _.assign(req.player, { cardsCount: gameData.playersCards[player._id].length }),
            })
        });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

function getDeck(times) {
    return _.flatten(_.times(times, _.constant(cards)));
}

async function startGame(req, res) {
    try {
        let { gameData, player } = req;
        const deckNeeds = Math.ceil(gameData.players.length / 7);
        const deck = shuffle(getDeck(deckNeeds));
        let playersCards = {}, playersPoints = {}, players = shuffle(gameData.players, { 'copy': true });
        for (let i = 0; i < players.length; i++) {
            const playerId = players[i]._id;
            playersCards[playerId] = [];
            playersPoints[playerId] = 0;
            for (let j = 0; j < 7; j++) {
                const ind = common.randomNumber(0, deck.length);
                const card = deck[ind];
                playersCards[playerId].push(card);
                playersPoints[playerId] += card.point;
                deck.splice(ind, 1);
            }
        }
        const ind = common.randomNumber(0, deck.length);
        const lastCard = deck[ind];
        deck.splice(ind, 1);
        const $setObj = {
            status: 'STARTED',
            players,
            lastCards: [lastCard],
            playersCards,
            playersPoints,
            deck,
            startedBy: player,
            currentPlayer: players[common.randomNumber(0, players.length - 1)],
            currentPlayerAction: 'SUBMIT',
            updatedAt: new Date(), updatedBy: player
        };
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.json(getGameInfoForPlayer($setObj, player._id));
        io.emit(req.params.id, { event: 'GAME_STARTED', gameData: _.pick($setObj, ['updatedBy']) });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function pass(req, res) {
    try {
        let { gameData, player } = req;
        let lastCards = gameData.currentPlayerDroppedCards.concat(gameData.lastCards);
        gameData.deck = gameData.deck.concat(lastCards.splice(2));
        shuffle(gameData.deck);
        let $setObj = {
            lastCards: lastCards,
            deck: gameData.deck,
            currentPlayer: common.getNextPlayer(gameData.players, player, 1),
            currentPlayerAction: 'SUBMIT',
            updatedAt: new Date(), updatedBy: player
        }
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'PLAYER_PASSED', gameData: _.omit($setObj, ['deck']) });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function showCards(req, res) {
    try {
        let { player } = req, { playersPoints, playersTotalPoints } = req.gameData;
        let isAnyoneHasMinimumPoints = LeastCountUtil.isAnyoneHasMinimumPoints(playersPoints, playersPoints[player._id]);
        let showResult = 'GOOD';
        if (isAnyoneHasMinimumPoints) {
            if (playersTotalPoints == null) {
                playersTotalPoints = {};
                for (let id in playersPoints) {
                    playersTotalPoints[id] = 0;
                }
            }
            playersTotalPoints[player._id] += 40;
            showResult = 'BAD';
        } else {
            playersPoints[player._id] = 0;
            if (playersTotalPoints == null) {
                playersTotalPoints = playersPoints;
            } else {
                for (let id in playersPoints) {
                    playersTotalPoints[id] += playersPoints[id];
                }
            }
        }
        let isAnyOneReachedMaxPoint = _.max(_.values(playersTotalPoints)) >= 80;
        let $setObj = {
            status: isAnyOneReachedMaxPoint ?
                'ENDED' :
                'PLAYER_SHOWED',
            playersTotalPoints: playersTotalPoints,
            showResult,
            updatedAt: new Date(), updatedBy: player,
        }
        const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.json($setObj)
        io.emit(req.params.id, { event: 'PLAYER_SHOWED', gameData: $setObj });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

async function restart(req, res) {
    try {
        let { gameData, player } = req;
        const $setObj = { status: 'CREATED', playersTotalPoints: null, updatedAt: new Date(), updatedBy: player };
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
        gameData.players.splice(playerIndex, 1);
        let $setObj = { players: gameData.players, updatedAt: new Date(), updatedBy: player };
        if (gameData.players.length && gameData.admin._id == player._id) {
            $setObj.admin = gameData.players[common.randomNumber(0, gameData.players.length - 1)];
        }
        if (gameData.status == 'STARTED') {
            if (gameData.players.length == 1) {
                $setObj.status = 'ENDED';
            }
            $setObj.deck = shuffle(gameData.deck.concat(gameData.playersCards[player._id]));
            if (gameData.players.length > 1 && gameData.currentPlayer._id == player._id) {
                $setObj.currentPlayer = common.getNextPlayer(gameData.players, gameData.currentPlayer);
            }
        }
        let updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(req.params.id, {
            event: 'PLAYER_LEFT_ROOM',
            gameData: _.assign(_.omit($setObj, ['players']), { leftPlayer: player })
        });
    } catch (err) {
        common.serverError(req, res, err);
    }
}

module.exports = {
    getGameStatus,
    createRoom,
    joinRoom,
    submitCard,
    takeCard,
    pass,
    showCards,
    startGame,
    restart,
    leaveRoom,
}