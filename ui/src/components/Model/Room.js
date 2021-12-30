import Request from './Request';

export default class {
    static createRoom(roomName, gameName) {
        return new Promise((resolve, reject) => {
            Request.post(`game/create`, { gameName, roomName }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static joinRoom(gameName, roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`game/${roomID}/join`, { gameName }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }
}