function pointMapper(number) {
    switch (number) {
        case 'J': return 11;
        case 'Q': return 12;
        case 'K': return 13;
        case 'A': return 14;
        default: return parseInt(number);
    }
}

function getPlayerWhoPutMaxCard(playersCard) {
    let max = -1, playerId = null;
    for (let id in playersCard) {
        if (playersCard[id].point > max) {
            max = playersCard[id].point;
            playerId = id;
        }
    }
    return playerId;
}

module.exports = {
    pointMapper,
    getPlayerWhoPutMaxCard,
}