const express = require('express');
const cors = require('cors')
const app = express();
const http = require('http').createServer(app);
require('./model/socket').init(http);
const { UI_ALLOW_ORIGIN } = require('./config');

app.use(cors({
    origin: UI_ALLOW_ORIGIN,
    optionsSuccessStatus: 200
}));

app.use(express.json());

const routes = require('./routes');

app.use('/api/v1', routes);

app.all('*', (req, res) => { res.sendStatus(404) });

module.exports = http;