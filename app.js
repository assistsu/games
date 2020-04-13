const express = require('express');
const app = express();
const http = require('http').createServer(app);
io = require('socket.io')(http);

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const routes = require('./routes');

app.use('/api/v1', routes);
app.use('/assets', express.static('./games/assets'));

app.get('*', function (req, res) {
    res.sendFile(__dirname + '/games/index.html');
});

module.exports = http;