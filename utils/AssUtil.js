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

    static getPlayerWhoPutMaxCard(playersCard) {
        let max = -1, playerId = null;
        for (let id in playersCard) {
            if (playersCard[id].point > max) {
                max = playersCard[id].point;
                playerId = id;
            }
        }
        return playerId;
    }

    static getCurrentPlayer(gameData) {
        return _.find(gameData.playersInGame, { _id: this.getPlayerWhoPutMaxCard(gameData.currentRoundPlayerCards) })
    }

    static removeDonePlayers(gameData, $setObj) {
        const donePlayers = _.filter(gameData.playersInGame, o => $setObj.playersCards[o._id].length == 0);
        donePlayers.map(o => {
            delete $setObj.playersCards[o._id];
            delete gameData.currentRoundPlayerCards[o._id];
            _.remove(gameData.playersInGame, { _id: o._id });
        });
        if (donePlayers.length) {
            $setObj.playersInGame = gameData.playersInGame;
        }
        return donePlayers;
    }
}
module.exports = AssUtil;