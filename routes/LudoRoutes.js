const express = require('express');
const app = express.Router();

const LudoController = require('../controllers/LudoController');
const GameController = require('../controllers/GameController');
const GameMiddleware = require('../middlewares/GameMiddleware');
const LudoMiddleware = require('../middlewares/LudoMiddleware');

app.post('/create', LudoController.createRoom);

app.get('/:id/info',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    LudoController.getGameStatus
);

app.post('/:id/join',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    GameMiddleware.playerShouldNotPresentInGame,
    GameMiddleware.gameStatusShouldBeCreated,
    LudoMiddleware.isMaximumPlayersReached,
    LudoController.joinRoom,
);

app.post('/:id/start',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeCreated,
    LudoMiddleware.isMinimumPlayersReached,
    LudoController.startGame
);

app.post('/:id/restart',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeEnded,
    LudoController.restart
);

app.post('/:id/roll-dice',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    LudoMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    LudoMiddleware.currentPlayerActionShouldBeRollDice,
    LudoController.rollDice
);

app.post('/:id/move-token',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    LudoMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    LudoMiddleware.currentPlayerActionShouldBeMoveToken,
    LudoController.moveToken
);

app.post('/:id/leave',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    LudoController.leaveRoom
);

app.post('/:id/message',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameController.newMessage
);

app.post('/:id/nudge',
    GameMiddleware.isValidRoomID, LudoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameController.nudgePlayer
);

module.exports = app;