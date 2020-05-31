const _ = require('lodash');

class AssUtil {

    static pointMapper(number) {
        switch (number) {
            case 'J': return 11;
            case 'Q': return 12;
            case 'K': return 13;
            case 'A': return 14;
            default: return parseInt(number);
        }
    }

    static getCurrentPlayer(gameData) {
        let max = -1, player = null;
        for (let i = 0; i < gameData.playersInGame.length; i++) {
            const currPlayer = gameData.playersInGame[i];
            const playerCard = gameData.currentRoundPlayerCards[currPlayer._id];
            if (playerCard && playerCard.point > max) {
                max = gameData.currentRoundPlayerCards[currPlayer._id].point;
                player = currPlayer;
            }
        }
        return player;
    }

    static removeDonePlayers(gameData, $setObj) {
        const donePlayers = _.filter(gameData.playersInGame, o => $setObj.playersCards[o._id].length == 0);
        donePlayers.map(o => {
            delete $setObj.playersCards[o._id];
            _.remove(gameData.playersInGame, { _id: o._id });
        });
        if (donePlayers.length) {
            $setObj.playersInGame = gameData.playersInGame;
        }
        return donePlayers;
    }
}
module.exports = AssUtil;