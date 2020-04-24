const _ = require('lodash');

exports.randomNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

exports.serverError = function (req, res, error) {
    res.status(500).json({ message: 'Server Error', errCode: 'SERVER_ERROR' });
    console.error("ERR!", {
        ..._.pick(req, ['originalUrl', 'method', 'params', 'player', 'playerIndex']),
        data: JSON.stringify(_.pick(req, ['query', 'body', 'gameData'])),
        error: error
    });
}

exports.getNextPlayer = function (players, currentPlayer, inc) {
    const currentPlayerInd = _.findIndex(players, { _id: currentPlayer._id });
    const nextPlayerInd = (currentPlayerInd + inc) % players.length;
    const nextPlayer = players[nextPlayerInd >= 0 ? nextPlayerInd : players.length - 1];
    return nextPlayer;
}