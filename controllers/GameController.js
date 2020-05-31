const mongodb = require('../model/mongodb');
const _ = require('lodash');
const { responses, serverError } = require('../utils/ResponseUtil');
const GameUtil = require('../utils/GameUtil');

class GameController {

    static async fetchGameInfo(req, res, next) {
        try {
            req.roomObjectId = mongodb.ObjectId(req.params.id);
            req.roomId = req.params.id;
        } catch (err) {
            return res.status(400).json(responses.INVALID_ROOM_ID);
        }
        try {
            const gameData = await mongodb.findById(req.gameName, req.roomId);
            if (_.isEmpty(gameData)) {
                return res.status(404).json(responses.ROOM_NOT_FOUND);
            }
            req.gameData = gameData;
            next();
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static getGameCommonFields(roomName, players, admin) {
        return {
            roomName: roomName,
            status: 'CREATED',
            players: players,
            admin: admin,
            messages: [],
            createdBy: admin,
            createdAt: new Date(),
            updatedBy: admin,
            updatedAt: new Date(),
        };
    }

    static getGameSpecificFields(gameName) {
        switch (gameName) {
            case 'uno': return {
                minPlayers: 2,
                maxPlayers: 10
            };
            case 'ass': return {
                minPlayers: 2,
                maxPlayers: 13
            };
            case 'leastcount': return {
                minPlayers: 2,
                maxPlayers: 16
            };
        }
    }

    static async create(req, res) {
        try {
            const insertObj = _.assign(
                GameController.getGameCommonFields(req.body.roomName, [req.player], req.player),
                GameController.getGameSpecificFields(req.gameName)
            );
            const gameData = await mongodb.insertOne(req.gameName, insertObj);
            res.json({ _id: gameData.ops[0]._id });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static info(req, res) {
        res.json(GameUtil.pickGamePublicFields(req.gameName, req.gameData, req.player));
    }

    static getUpdatedFields(player) {
        return {
            updatedAt: new Date(),
            updatedBy: player
        }
    }

    static async join(req, res) {
        try {
            let { player } = req;
            const $setObj = GameController.getUpdatedFields(player);
            const $pushObj = { players: player };
            const updatedGameData = await mongodb.updateById(req.gameName, req.roomObjectId, { $push: $pushObj, $set: $setObj });
            res.sendStatus(200);
            io.emit(req.roomId, { event: 'NEW_PLAYER_JOINED', gameData: { player: player, ...$setObj } });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async storeEndedGameData(gameName, gameData) {
        try {
            gameData.gameName = gameName;
            gameData.gameId = gameData._id;
            delete gameData._id;
            await mongodb.insertOne('ended_games', gameData);
        } catch (err) {
            console.error("ERR! -> Occurred while Storing ended game data", err);
        }
    }

    static async restart(req, res) {
        try {
            let { gameData, player } = req;
            const $setObj = _.assign({ status: 'CREATED', playersInGame: gameData.players }, GameController.getUpdatedFields());
            const updatedGameData = await mongodb.updateById(req.gameName, req.roomObjectId, { $set: $setObj });
            GameController.storeEndedGameData(req.gameName, _.assign(gameData, _.pick($setObj, ['updatedAt', 'updatedBy'])));
            res.json($setObj);
            io.emit(req.roomId, { event: 'GAME_RESTARTED', gameData: $setObj });
        } catch (err) {
            serverError(req, res, err);
        }
    }


    static async message(req, res) {
        try {
            const { text } = req.body;
            let { player } = req;
            const message = { text: text, ...player, createdAt: new Date() };
            const updatedGameData = await mongodb.updateById(req.gameName, req.roomObjectId, { $push: { messages: message } });
            res.json(message);
            req.gameData.players.forEach(o => {
                if (o._id == player._id) return;
                io.emit(o._id, { event: 'NEW_MESSAGE', message: message });
            });
        } catch (err) {
            serverError(req, res, err);
        }
    }

    static async nudge(req, res) {
        const { playerId } = req.body;
        if (req.player._id == playerId) return res.status(400).json(responses.NUDGING_HIMSELF);
        if (_.findIndex(req.gameData.players, { _id: playerId }) == -1) return res.status(400).json(responses.NUDGE_PLAYER_NOT_IN_ROOM);
        res.sendStatus(200);
        io.emit(playerId, { event: 'NUDGED', nudgedBy: req.player });
    }
}



module.exports = GameController;