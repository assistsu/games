const express = require('express');
const app = express.Router();

const UnoController = require('../controllers/UnoController');
const UnoMiddleware = require('../middlewares/UnoMiddleware');

app.post('/create', UnoController.createRoom);

app.get('/:id/info',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoController.getGameStatus
);

app.post('/:id/join',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldNotPresentInGame,
    UnoMiddleware.gameStatusShouldBeCreated,
    UnoController.joinRoom,
);

app.post('/:id/start',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.isAdmin,
    UnoMiddleware.gameStatusShouldBeCreated,
    UnoController.startGame
);

app.post('/:id/restart',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.isAdmin,
    UnoMiddleware.gameStatusShouldBeEnded,
    UnoController.restart
);

app.post('/:id/submit-card',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.gameStatusShouldBeStarted,
    UnoMiddleware.isMyMove,
    UnoController.submitCard
);

app.post('/:id/take-card',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.gameStatusShouldBeStarted,
    UnoMiddleware.isMyMove,
    UnoController.takeCard
);

app.post('/:id/pass-card',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.gameStatusShouldBeStarted,
    UnoMiddleware.isMyMove,
    UnoController.passCard
);

app.post('/:id/message',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoController.newMessage
);

app.post('/:id/leave',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoController.leaveRoom
);

app.post('/:id/nudge',
    UnoMiddleware.isValidRoomID, UnoMiddleware.isRoomExist,
    UnoMiddleware.playerShouldPresentInGame,
    UnoController.nudgePlayer
);

module.exports = app;