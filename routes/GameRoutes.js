const express = require('express');
const app = express.Router();

const GameController = require('../controllers/GameController');
const GameMiddleware = require('../middlewares/GameMiddleware');

app.post('/create', GameMiddleware.isValidRoomName, GameController.create);

app.get('/:id/info', GameController.fetchGameInfo,
    GameController.info
);

app.post('/:id/join', GameController.fetchGameInfo,
    GameMiddleware.playerShouldNotPresent,
    GameMiddleware.gameStatusShouldBeCreated,
    GameMiddleware.isRoomFull,
    GameController.join,
);

app.post('/:id/restart', GameController.fetchGameInfo,
    GameMiddleware.isAdmin,
    GameMiddleware.gameStatusShouldBeEnded,
    GameController.restart
);

app.post('/:id/message', GameController.fetchGameInfo,
    GameMiddleware.playerShouldPresent,
    GameMiddleware.isValidMessage,
    GameController.message
);

app.post('/:id/nudge', GameController.fetchGameInfo,
    GameMiddleware.playerShouldPresent,
    GameMiddleware.isAdmin,
    GameController.nudge
);

module.exports = app;