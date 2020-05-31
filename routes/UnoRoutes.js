const express = require('express');
const app = express.Router();

const UnoMiddleware = require('../middlewares/UnoMiddleware');
const UnoController = require('../controllers/UnoController');

app.post('/start',
    UnoMiddleware.gameStatusShouldBeCreated,
    UnoMiddleware.isAdmin,
    UnoMiddleware.isMinPlayersPresent,
    UnoController.start
);

app.post('/leave',
    UnoMiddleware.playerShouldPresent,
    UnoController.leave
);

app.post('/submit',
    UnoMiddleware.gameStatusShouldBeStarted,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.isMyMove,
    UnoMiddleware.isChosenCardValid,
    UnoController.submit
);

app.post('/take',
    UnoMiddleware.gameStatusShouldBeStarted,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.isMyMove,
    UnoController.take
);

app.post('/pass',
    UnoMiddleware.gameStatusShouldBeStarted,
    UnoMiddleware.playerShouldPresentInGame,
    UnoMiddleware.isMyMove,
    UnoController.pass
);

module.exports = app;