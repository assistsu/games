import Request from './Request';

export default class {
    static submitChosenCards(roomID, data) {
        return new Promise((resolve, reject) => {
            Request.post(`leastcount/${roomID}/submit`, data).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static takeCard(roomID, data) {
        return new Promise((resolve, reject) => {
            Request.post(`leastcount/${roomID}/take`, data).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static noShow(roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`leastcount/${roomID}/no-show`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static showCards(roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`leastcount/${roomID}/show`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static continueGame(roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`leastcount/${roomID}/continue`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }
}