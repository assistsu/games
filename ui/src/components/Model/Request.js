const axios = require("axios");
const basePath = '/api/v1/';

function request(path, method, data = {}) {
    const player = JSON.parse(localStorage.getItem(AppConfig.PLAYER_STORED_KEY));
    return new Promise((resolve, reject) => {
        return axios(Object.assign({
            url: basePath + path,
            method,
            data,
            headers: {
                'x-player-token': player ? player.token : ''
            },
        }, data)).then(resp => resolve(resp.data)).catch((err) => onError(err, reject));
    });
}

export default class {
    static get(path, params) {
        return request(path, 'GET', { params });
    }

    static post(path, data) {
        return request(path, 'POST', { data });
    }

    static delete(path) {
        return request(path, 'DELETE');
    }
}

function onError(err, reject) {
    if(err.response){
        reject(err.response.data);
        console.error("ERR::",JSON.stringify(err.response));
    }else{
        reject(err);
        console.error("ERR::", JSON.stringify(err));
    }
}