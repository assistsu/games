const express = require('express');
const app = express.Router();

const AssController = require('../controllers/AssController');
const GameMiddleware = require('../middlewares/GameMiddleware');
const AssMiddleware = require('../middlewares/AssMiddleware');

app.post('/create', AssController.createRoom);

app.get('/:id/info',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    AssController.getGameStatus
);

app.post('/:id/join',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    GameMiddleware.playerShouldNotPresentInGame,
    GameMiddleware.gameStatusShouldBeCreated,
    AssMiddleware.isMaximumPlayersReached,
    AssController.joinRoom,
);

app.post('/:id/start',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeCreated,
    AssMiddleware.isMinimumPlayersReached,
    AssController.startGame
);

app.post('/:id/restart',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeEnded,
    AssController.restart
);

app.post('/:id/submit-card',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    AssMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    AssMiddleware.isChosenCardValid,
    AssMiddleware.isChosenCardPresentInPlayerDeck,
    AssController.submitCard
);

app.post('/:id/message',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    AssController.newMessage
);

app.post('/:id/leave',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    AssController.leaveRoom
);

app.post('/:id/nudge',
    GameMiddleware.isValidRoomID, AssMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    AssController.nudgePlayer
);

module.exports = app;