const socket = require('socket.io');

let io;

module.exports = {
    init: function (server) {
        io = socket(server);
    },
    emit: function (id, data) {
        try {
            io.emit(id, data);
        } catch (e) {
            console.error(e);
        }
    },
};