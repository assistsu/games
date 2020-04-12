const express = require('express');
const app = express.Router();

const PlayerController = require('../controllers/PlayerController');

app.post('/new', PlayerController.createPlayer);

module.exports = app;