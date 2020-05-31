const express = require('express');
const app = express.Router();
const _ = require('lodash');

const PlayerMiddleware = require('../middlewares/PlayerMiddleware');
const GameMiddleware = require('../middlewares/GameMiddleware');
const GameController = require('../controllers/GameController');
const GameUtil = require('../utils/GameUtil');

/** Player APIs */
app.use('/player', require('./PlayerRoutes'));

/** Common Game APIs */
app.use('/game', PlayerMiddleware.validatePlayer,
    GameMiddleware.isValidGameName,
    require('./GameRoutes')
);

const gamesMap = {
    'uno': require('./UnoRoutes'),
    'ass': require('./AssRoutes'),
    'leastcount': require('./LeastCountRoutes'),
};
_.forEach(gamesMap, (Routes, gameName) => {
    app.use(`/${gameName}/:id`, PlayerMiddleware.validatePlayer,
        GameUtil.setGameName(gameName),
        GameController.fetchGameInfo,
        Routes
    );
});

module.exports = app;