import Request from './Request';

export default class {
    static login(playerName) {
        return new Promise((resolve, reject) => {
            Request.post('player/new', { playerName }).then(resp => resolve(resp)).catch(err => reject(err));
        });
    }
}