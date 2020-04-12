const express = require('express');
const app = express();
const http = require('http').createServer(app);
const Config = require('./config');
io = require('socket.io')(http);

const bodyParser = require('body-parser');
const mongodb = require('./model/mongodb');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const routes = require('./routes');

app.use('/api/v1', routes);
app.use('/assets', express.static('./games/assets'));

app.get('*', function (req, res) {
  res.sendFile(__dirname + '/games/index.html');
});

mongodb.connect().then(() => {
  http.listen(Config.PORT, function (err) {
    if (err) throw err;
    console.log(`App runs on http://localhost:${Config.PORT}`);
  })
});