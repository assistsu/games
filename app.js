const express = require('express');
const cors = require('cors')
const app = express();
const http = require('http').createServer(app);
io = require('socket.io')(http);

app.use(cors({
    origin: 'https://assistsu-games.herokuapp.com',
    optionsSuccessStatus: 200
}));

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const routes = require('./routes');

app.use('/api/v1', routes);

app.all('*', (req, res) => { res.sendStatus(404) });

module.exports = http;