import Request from './Request';

export default class {
    static getGameInfo(gameName, roomId) {
        return new Promise((resolve, reject) => {
            Request.get(`game/${roomId}/info`, { gameName }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static startGame(gameName, roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`${gameName}/${roomID}/start`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static restartGame(gameName, roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`game/${roomID}/restart`, { gameName }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static leaveGame(gameName, roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`${gameName}/${roomID}/leave`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static sendMessage(gameName, roomID, text) {
        return new Promise((resolve, reject) => {
            Request.post(`game/${roomID}/message`, { gameName, text }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static nudgePlayer(gameName, roomID, playerId) {
        return new Promise((resolve, reject) => {
            Request.post(`game/${roomID}/nudge`, { gameName, playerId }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }
}