import Request from './Request';

export default class {
    static submitChosenCard(roomID, data) {
        return new Promise((resolve, reject) => {
            Request.post(`uno/${roomID}/submit`, data).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static takeCard(roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`uno/${roomID}/take`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }

    static passCard(roomID) {
        return new Promise((resolve, reject) => {
            Request.post(`uno/${roomID}/pass`).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }
}