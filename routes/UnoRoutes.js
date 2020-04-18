const express = require('express');
const app = express.Router();

const UnoController = require('../controllers/UnoController');
const GameMiddleware = require('../middlewares/GameMiddleware');
const UnoMiddleware = require('../middlewares/UnoMiddleware');

app.post('/create', UnoController.createRoom);

app.get('/:id/info',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoController.getGameStatus
);

app.post('/:id/join',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldNotPresentInGame,
    GameMiddleware.gameStatusShouldBeCreated,
    UnoController.joinRoom,
);

app.post('/:id/start',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeCreated,
    UnoController.startGame
);

app.post('/:id/restart',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeEnded,
    UnoController.restart
);

app.post('/:id/submit-card',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    UnoController.submitCard
);

app.post('/:id/take-card',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    UnoController.takeCard
);

app.post('/:id/pass-card',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    GameMiddleware.gameStatusShouldBeStarted,
    GameMiddleware.isMyMove,
    UnoController.passCard
);

app.post('/:id/message',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    UnoController.newMessage
);

app.post('/:id/leave',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    UnoController.leaveRoom
);

app.post('/:id/nudge',
    GameMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    GameMiddleware.playerShouldPresentInGame,
    UnoController.nudgePlayer
);

module.exports = app;