const socket = require('socket.io');
const { UI_ALLOW_ORIGIN } = require('../config');

let io;

module.exports = {
    init: function (server) {
        io = socket(server, {
            cors: {
                origin: UI_ALLOW_ORIGIN,
                methods: ["GET", "POST"],
            }
        });
    },
    emit: function (id, data) {
        try {
            io.emit(id, data);
        } catch (e) {
            console.error(e);
        }
    },
};