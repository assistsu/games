const express = require('express');
const app = express.Router();

const PlayerController = require('../controllers/PlayerController');
const PlayerMiddleware = require('../middlewares/PlayerMiddleware');

app.post('/new', PlayerMiddleware.isValidFields, PlayerController.createPlayer);

module.exports = app;