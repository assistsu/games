const express = require('express');
const app = express();
const http = require('http').createServer(app);
require('./model/io').init(http);

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const routes = require('./routes');

app.use('/api/v1', routes);

if (process.env.NODE_ENV == 'prod') {
    app.get('/assets/js/bundle/*.js', function (req, res, next) {
        req.url += '.gz';
        res.set('Content-Encoding', 'gzip');
        next();
    });
}

app.use('/assets', express.static('./games/assets'));

app.get('*', function (req, res) {
    res.sendFile(__dirname + '/games/index.html');
});

module.exports = http;