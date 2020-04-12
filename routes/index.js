const express = require('express');
const app = express.Router();

const PlayerRoutes = require('./PlayerRoutes');
const UnoRoutes = require('./UnoRoutes');

const PlayerMiddleware = require('../middlewares/PlayerMiddleware');

/** Player APIs */
app.use('/player', PlayerRoutes);

/** UNO Game APIs */
app.use('/game/uno', PlayerMiddleware.validatePlayer, UnoRoutes);

app.all('*', (req, res) => { res.status(404).send() });

module.exports = app;