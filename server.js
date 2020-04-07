const express = require('express');
const app = express();
var http = require('http').createServer(app);
io = require('socket.io')(http);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:5000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-player-token");
  next();
});

const bodyParser = require('body-parser');
const mongodb = require('./model/mongodb');

app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json());

const routes = require('./routes');

app.use('/api/v1', routes);

app.get('*', function (req, res) {
  res.redirect('http://localhost:5000')
});

const port = 8080;
mongodb.connect().then(() => {
  http.listen(port, function (err) {
    if (err) throw err;
    console.log(`App runs on http://localhost:${port}`);
  })
});