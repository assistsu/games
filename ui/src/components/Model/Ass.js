import Request from './Request';

export default class {
    static submitChosenCard(roomID, data) {
        return new Promise((resolve, reject) => {
            Request.post(`ass/${roomID}/submit`, data).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }
}