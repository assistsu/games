const express = require('express');
const app = express.Router();

const GameMiddleware = require('../middlewares/GameMiddleware');
const LeastCountMiddleware = require('../middlewares/LeastCountMiddleware');

const LeastCountController = require('../controllers/LeastCountController');
const GameController = require('../controllers/GameController');

app.post('/create', LeastCountController.createRoom);

app.get('/:id/info',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    LeastCountController.getGameStatus
);

app.post('/:id/join',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldNotPresentInGame,
    GameMiddleware.gameStatusShouldBeCreated,
    LeastCountController.joinRoom,
);

app.post('/:id/leave',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    LeastCountController.leaveRoom
);

app.post('/:id/start',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeCreated,
    LeastCountMiddleware.isMinimumPlayersReached,
    LeastCountController.startGame
);

app.post('/:id/continue',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    LeastCountMiddleware.gameStatusShouldbePlayerShowed,
    LeastCountController.startGame
);

app.post('/:id/restart',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeEnded,
    LeastCountController.restart
);

app.post('/:id/submit-card',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    LeastCountMiddleware.isChosenCardValid,
    LeastCountMiddleware.isPlayerActionSubmit,
    LeastCountController.submitCard
);

app.post('/:id/take-card',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    LeastCountMiddleware.isPlayerActionTake,
    LeastCountMiddleware.validateTakeCardFields,
    LeastCountController.takeCard
);

app.post('/:id/no-show',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    LeastCountMiddleware.isPlayerActionDecide,
    LeastCountController.noShow
);

app.post('/:id/show-cards',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    LeastCountMiddleware.isPlayerActionDecide,
    LeastCountController.showCards
);

app.post('/:id/message',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    LeastCountMiddleware.setCollectionName,
    GameController.newMessage
);

app.post('/:id/nudge',
    GameMiddleware.isValidRoomID, LeastCountMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameController.nudgePlayer
);

module.exports = app;