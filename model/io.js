const socketIO = require('socket.io');

let io = {};

exports.init = function (http) {
    io = socketIO(http);
}

exports.emit = function (id, data) {
    io.emit(id, data);
}