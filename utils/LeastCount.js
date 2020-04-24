const cardTypes = ['SPADE', 'HEART', 'CLUB', 'DIAMOND'];
exports.cardTypes = cardTypes;

exports.getCards = function () {
    let cards = [];
    Object.values(cardTypes).forEach(o => {
        for (let i = 1, point = 1; i <= 13; i++) {
            cards.push({ type: o, number: i, point: point });
            if (point < 10) point++;
        }
    });
    // cards.push({ type: 'JOKER', number: 0, point: 0 });
    // cards.push({ type: 'JOKER', number: 0, point: 0 });
    return cards;
}

exports.isAnyoneHasMinimumPoints = function (pointsObj, currentMinimum) {
    for (let playerId in pointsObj) {
        if (pointsObj[playerId] < currentMinimum) {
            return true;
        }
    }
    return false;
}