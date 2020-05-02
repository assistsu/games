const _ = require('lodash');
const CommonUtil = require('../utils/CommonUtil');
const mongodb = require('../model/mongodb');

async function newMessage(req, res) {
    try {
        const { text } = req.body;
        let { player } = req;
        const message = { text: text, ...player, createdAt: new Date() };
        const updatedGameData = await mongodb.updateById(req.collectionName, req.roomObjectId, { $push: { messages: message } });
        res.sendStatus(200);
        io.emit(req.params.id, { event: 'NEW_MESSAGE', gameData: { message: message } });
    } catch (err) {
        CommonUtil.serverError(req, res, err);
    }
}

async function nudgePlayer(req, res) {
    try {
        const { playerId } = req.body;
        if (req.player._id == playerId) return res.status(400).json({ message: 'You cannot nudge yourself', errCode: 'NUDGING_HIMSELF' });
        if (_.findIndex(req.gameData.players, { _id: playerId }) == -1) return res.status(400).json({ message: 'The player you are nudging not in your room', errCode: 'NUDGE_PLAYER_NOT_IN_ROOM' });
        // if (req.gameData.playerNudged && req.gameData.playerNudged[playerId]) {
        //     const diff = new Date().getTime() - req.gameData.playerNudged[playerId];
        //     if (diff < 3000) {
        //         return res.status(400).json({ message: 'Player already nudged', errCode: 'PLAYER_NUDGED_ALREADY' });
        //     }
        // }
        // let $setObj = {};
        // $setObj[`playerNudged.${playerId}`] = new Date().getTime();
        // const updatedGameData = await mongodb.updateById(collectionName, req.roomObjectId, { $set: $setObj });
        res.sendStatus(200);
        io.emit(playerId, { event: 'NUDGED', nudgedBy: req.player });
    } catch (err) {
        CommonUtil.serverError(req, res, err);
    }
}

module.exports = {
    newMessage,
    nudgePlayer,
}