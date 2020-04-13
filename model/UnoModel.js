const mongodb = require('./mongodb');

exports.getGameInfo = async function (id) {
    return await mongodb.findById('uno', id);
}