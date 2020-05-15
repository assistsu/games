const _ = require('lodash');

function getNextPlayer(players, currentPlayer, inc = 1) {
    const currentPlayerInd = _.findIndex(players, { _id: currentPlayer._id });
    const nextPlayerInd = (currentPlayerInd + inc) % players.length;
    const nextPlayer = players[nextPlayerInd >= 0 ? nextPlayerInd : players.length - 1];
    return nextPlayer;
}

const standardDeckCardTypes = ['SPADE', 'HEART', 'CLUB', 'DIAMOND'];

function getStandardDeck(pointMapper, includeJoker = false) {
    let cards = [];
    _.values(standardDeckCardTypes).forEach(o => {
        for (let i = 2; i <= 10; i++) {
            cards.push({ type: o, number: i.toString(), point: pointMapper(i) });
        }
        cards.push({ type: o, number: 'J', point: pointMapper('J') });
        cards.push({ type: o, number: 'Q', point: pointMapper('Q') });
        cards.push({ type: o, number: 'K', point: pointMapper('K') });
        cards.push({ type: o, number: 'A', point: pointMapper('A') });
    });
    if (includeJoker) {
        [1, 2].forEach(o => {
            cards.push({ type: 'JOKER', number: 'JOKER', point: pointMapper('JOKER') });
        });
    }
    return cards;
}

module.exports = {
    getNextPlayer,
    standardDeckCardTypes,
    getStandardDeck,
}