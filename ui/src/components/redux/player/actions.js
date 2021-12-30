import constants from './constants';
import store from '../store';

export function setPlayerAction(player) {
    store.dispatch({
        type: constants.SET_PLAYER_DETAILS,
        player,
    })
}