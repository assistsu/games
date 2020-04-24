const cardTypes = ['SPADE', 'HEART', 'CLUB', 'DIAMOND'];
exports.cardTypes = cardTypes;

exports.getCards = function () {
    let cards = [];
    Object.values(cardTypes).forEach(o => {
        for (let i = 2; i <= 14; i++) {
            cards.push({ type: o, number: i });
        }
    });
    return cards;
}

exports.getPlayerWhoPutMaxCard = function (playersCard) {
    let max = -1, playerId = null;
    for (let id in playersCard) {
        if (playersCard[id].number > max) {
            max = playersCard[id].number;
            playerId = id;
        }
    }
    return playerId;
}