const express = require('express');
const app = express();
var http = require('http').createServer(app);
io = require('socket.io')(http);
io.on('connection', function (socket) {
  console.log('connected');
});
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const mongodb = require('./model/mongodb');


app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json());

const ApiV1 = require('./routes/v1/routes');

app.use('/api/v1', ApiV1);

app.use('/assets', express.static('uno-client/assets/'))
app.get(['/', '/room/*',], function (req, res) {
  res.sendFile(__dirname + '/uno-client/index.html')
})

const port = 8080;
mongodb.connect().then(() => {
  http.listen(port, function (err) {
    if (err) throw err;
    console.log(`server runs on http://localhost:${port}`);
  })
});