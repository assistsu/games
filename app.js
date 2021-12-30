const express = require('express');
const app = express();
const http = require('http').createServer(app);
require('./model/socket').init(http);

app.use(express.json());

const routes = require('./routes');

app.use('/api/v1', routes);

app.use('/assets', express.static('./ui/assets'));

app.get([
    '/',
    '/profile',
    '/game/*',
], function (req, res) {
    res.sendFile(__dirname + '/ui/home.html');
});

app.all('*', (req, res) => { res.sendStatus(404) });

module.exports = http;