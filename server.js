const express = require('express');
const app = express();
var http = require('http').createServer(app);
io = require('socket.io')(http);

const bodyParser = require('body-parser');
const mongodb = require('./model/mongodb');

app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json());

const routes = require('./routes');

app.use('/api/v1', routes);
app.use('/assets', express.static('./games/assets'))

app.get('*', function (req, res) {
  res.sendFile(__dirname + '/games/index.html');
});

const port = 8080;
mongodb.connect().then(() => {
  http.listen(port, function (err) {
    if (err) throw err;
    console.log(`App runs on http://localhost:${port}`);
  })
});