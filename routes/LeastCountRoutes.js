const express = require('express');
const app = express.Router();

const LeastCountMiddleware = require('../middlewares/LeastCountMiddleware');
const LeastCountController = require('../controllers/LeastCountController');

app.post('/start',
    LeastCountMiddleware.gameStatusShouldBeCreated,
    LeastCountMiddleware.isAdmin,
    LeastCountMiddleware.isMinPlayersPresent,
    LeastCountController.start
);

app.post('/leave',
    LeastCountMiddleware.playerShouldPresent,
    LeastCountController.leave
);

app.post('/continue',
    LeastCountMiddleware.gameStatusShouldbePlayerShowed,
    LeastCountMiddleware.isAdmin,
    LeastCountMiddleware.isMinPlayersPresent,
    LeastCountController.start
);

app.post('/show',
    LeastCountMiddleware.gameStatusShouldBeStarted,
    LeastCountMiddleware.playerShouldPresentInGame,
    LeastCountMiddleware.isMyMove,
    LeastCountMiddleware.isPlayerActionDecide,
    LeastCountController.show
);

app.post('/no-show',
    LeastCountMiddleware.gameStatusShouldBeStarted,
    LeastCountMiddleware.playerShouldPresentInGame,
    LeastCountMiddleware.isMyMove,
    LeastCountMiddleware.isPlayerActionDecide,
    LeastCountController.noShow
);

app.post('/submit',
    LeastCountMiddleware.gameStatusShouldBeStarted,
    LeastCountMiddleware.playerShouldPresentInGame,
    LeastCountMiddleware.isMyMove,
    LeastCountMiddleware.isChosenCardValid,
    LeastCountMiddleware.isPlayerActionSubmit,
    LeastCountController.submit
);

app.post('/take',
    LeastCountMiddleware.gameStatusShouldBeStarted,
    LeastCountMiddleware.playerShouldPresentInGame,
    LeastCountMiddleware.isMyMove,
    LeastCountMiddleware.isPlayerActionTake,
    LeastCountMiddleware.validateTakeCardFields,
    LeastCountController.take
);

module.exports = app;