import { toast } from 'react-toastify';

function playAudio(selector) {
    $(`#${selector}`).trigger('play')
}

function playNewNotify() {
    playAudio('new-notify');
}
function playErrorNotify() {
    playAudio('error-notify');
}
function playLightNotify() {
    playAudio('light-notify');
}
function playBuzzNotify() {
    playAudio('buzz-notify');
}

function resetStateGetGameInfo() {
    this.setState(this.getInitialValues(), this.props.getGameInfo());
}

function resetStateUpdateGameInfo(gameData) {
    this.setState(this.getInitialValues(), () => this.props.updateGameInfo(gameData));
}

export default {
    audios: [
        "new-notify",
        "error-notify",
        "light-notify",
        "buzz-notify",
    ],
    playNewNotify,
    playErrorNotify,
    playLightNotify,
    playBuzzNotify,
    vibrate: function (time = 200) {
        window.navigator.vibrate(time);
    },
    resetStateGetGameInfo,
    resetStateUpdateGameInfo,
    handleError: function (error) {
        playErrorNotify();
        const message = error.message || 'Error Occurred';
        toast.error(message, { toastId: message });
        this.setState(this.getInitialValues());
    },
};