const _ = require('lodash');

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function serverError(req, res, error) {
    res.status(500).json({ message: 'Server Error', errCode: 'SERVER_ERROR' });
    console.error("ERR!", {
        ..._.pick(req, ['originalUrl', 'method', 'params', 'player', 'playerIndex']),
        data: JSON.stringify(_.pick(req, ['query', 'body', 'gameData'])),
        error: error
    });
}

function getNextPlayer(players, currentPlayer, inc) {
    const currentPlayerInd = _.findIndex(players, { _id: currentPlayer._id });
    const nextPlayerInd = (currentPlayerInd + inc) % players.length;
    const nextPlayer = players[nextPlayerInd >= 0 ? nextPlayerInd : players.length - 1];
    return nextPlayer;
}

const standardDeckCardTypes = ['SPADE', 'HEART', 'CLUB', 'DIAMOND'];
const standardDeckNumberTypes = ['A', 'K', 'Q', 'J', ...Array(10).fill().map((o, i) => i.toString())];

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
    randomNumber,
    serverError,
    getNextPlayer,
    standardDeckCardTypes,
    getStandardDeck,
}