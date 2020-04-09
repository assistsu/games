const mongodb = require('../model/mongodb');

async function checkValidRoom(req, res, next) {
    try {
        const room = await mongodb.findById('rooms', req.data.id);
        if (result.length == 0) {
            return res.status(404).json({ message: 'ROOM_NOT_FOUND' });
        }
        req.room = room;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server Error' });
    }
}

function getFields() {
    const roomID = req.params.id;
}

module.exports = {
    isRoomExist,
}