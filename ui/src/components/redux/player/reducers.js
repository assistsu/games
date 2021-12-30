import constants from './constants';

let player = null;
try {
    player = JSON.parse(localStorage.getItem(AppConfig.PLAYER_STORED_KEY));
} catch (e) {
    console.log("ERR::onParsePlayer", e);
}

const initialState = {
    player: player,
}

function storeplayerOnLocalStorage(player) {
    try {
        localStorage.setItem(AppConfig.PLAYER_STORED_KEY, JSON.stringify(player));
    } catch (err) {
        console.log("ERR::storePlayerOnLocalStorage", err);
    }
}

export default (state = initialState, action) => {
    switch (action.type) {
        case constants.SET_PLAYER_DETAILS:
            storeplayerOnLocalStorage(action.player);
            return Object.assign({}, state, {
                player: action.player,
            });
        default: return state;
    }
}
