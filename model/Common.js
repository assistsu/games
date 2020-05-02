const mongodb = require('./mongodb');

async function storeEndedGameData(gameName, gameData) {
    try {
        gameData.gameName = gameName;
        gameData.gameId = gameData._id;
        delete gameData._id;
        await mongodb.insertOne('ended_games', gameData);
    } catch (err) {
        console.error("ERR! -> Occurred while Storing ended game data", err);
    }
}

module.exports = {
    storeEndedGameData,
}