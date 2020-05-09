const express = require('express');
const app = express.Router();

const PlayerRoutes = require('./PlayerRoutes');
const UnoRoutes = require('./UnoRoutes');
const AssRoutes = require('./AssRoutes');
const LeastCountRoutes = require('./LeastCountRoutes');
const LudoRoutes = require('./LudoRoutes');

const PlayerMiddleware = require('../middlewares/PlayerMiddleware');

/** Player APIs */
app.use('/player', PlayerRoutes);

/** UNO Game APIs */
app.use('/game/uno', PlayerMiddleware.validatePlayer, UnoRoutes);
/** Ass Game APIs */
app.use('/game/ass', PlayerMiddleware.validatePlayer, AssRoutes);
/** Least Count Game APIs */
app.use('/game/leastcount', PlayerMiddleware.validatePlayer, LeastCountRoutes);
/** Ludo Game APIs */
app.use('/game/ludo', PlayerMiddleware.validatePlayer, LudoRoutes);

module.exports = app;