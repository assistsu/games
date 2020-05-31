const express = require('express');
const app = express.Router();

const AssMiddleware = require('../middlewares/AssMiddleware');
const AssController = require('../controllers/AssController');

app.post('/start',
    AssMiddleware.gameStatusShouldBeCreated,
    AssMiddleware.isAdmin,
    AssMiddleware.isMinPlayersPresent,
    AssController.start
);

app.post('/leave',
    AssMiddleware.playerShouldPresent,
    AssController.leave
);

app.post('/submit',
    AssMiddleware.gameStatusShouldBeStarted,
    AssMiddleware.playerShouldPresentInGame,
    AssMiddleware.isMyMove,
    AssMiddleware.isChosenCardValid,
    AssController.submit
);

module.exports = app;