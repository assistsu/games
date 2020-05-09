const mongodb = require('../model/mongodb');
const ResponseUtil = require('../utils/ResponseUtil');

async function isRoomExist(req, res, next) {
    try {
        req.gameData = await mongodb.findById('uno', req.params.id);
        if (!req.gameData) {
            return res.status(404).json({ message: 'Room Not found', errCode: 'ROOM_NOT_FOUND' });
        }
        next();
    } catch (err) {
        ResponseUtil.serverError(req, res, err);
    }
}

module.exports = {
    isRoomExist,
}