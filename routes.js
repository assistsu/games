const express = require('express');
const app = express.Router();

const PlayerController = require('./controllers/PlayerController');
const UnoController = require('./controllers/UnoController');
const ChatController = require('./controllers/ChatController');

const PlayerMiddleware = require('./middlewares/PlayerMiddleware');

/** User APIs */
app.post('/user/new', PlayerController.createPlayer);

/** UNO Game APIs */
app.get('/game/uno/:id/info', PlayerMiddleware.validatePlayer, UnoController.getGameStatus);
app.post('/game/uno/create', PlayerMiddleware.validatePlayer, UnoController.createRoom);
app.post('/game/uno/join', PlayerMiddleware.validatePlayer, UnoController.joinRoom);
app.post('/game/uno/:id/start', PlayerMiddleware.validatePlayer, UnoController.startGame);
app.post('/game/uno/:id/restart', PlayerMiddleware.validatePlayer, UnoController.restart);
app.post('/game/uno/:id/submit-card', PlayerMiddleware.validatePlayer, UnoController.submitCard);
app.post('/game/uno/:id/take-card', PlayerMiddleware.validatePlayer, UnoController.takeCard);
app.post('/game/uno/:id/pass-card', PlayerMiddleware.validatePlayer, UnoController.passCard);
app.post('/game/uno/:id/message', PlayerMiddleware.validatePlayer, ChatController.newMessagefunction);

module.exports = app;