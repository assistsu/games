const _ = require('lodash');

class LeastCountUtil {

    static pointMapper(number) {
        switch (number) {
            case 'A':
                return 1;
            case 'K':
            case 'Q':
            case 'J':
                return 10;
            case 'JOKER':
                return 0;
            default:
                return parseInt(number);
        }
    }

    static getDeck(cards, times) {
        return _.flatten(_.times(times, _.constant(cards)));
    }

    static isAnyoneHasMinimumPoints(pointsObj, currentMinimum) {
        for (let playerId in pointsObj) {
            if (pointsObj[playerId] < currentMinimum) {
                return true;
            }
        }
        return false;
    }

}

module.exports = LeastCountUtil;