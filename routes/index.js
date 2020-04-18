const express = require('express');
const app = express.Router();

const PlayerRoutes = require('./PlayerRoutes');
const UnoRoutes = require('./UnoRoutes');
const AssRoutes = require('./AssRoutes');

const PlayerMiddleware = require('../middlewares/PlayerMiddleware');

/** Player APIs */
app.use('/player', PlayerRoutes);

/** UNO Game APIs */
app.use('/game/uno', PlayerMiddleware.validatePlayer, UnoRoutes);
app.use('/game/ass', PlayerMiddleware.validatePlayer, AssRoutes);

app.all('*', (req, res) => { res.sendStatus(404) });

module.exports = app;