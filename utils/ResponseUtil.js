const _ = require('lodash');

function serverError(req, res, error) {
    res.status(500).json({ message: 'Server Error', errCode: 'SERVER_ERROR' });
    console.error("ERR!", {
        ..._.pick(req, ['originalUrl', 'method', 'params', 'player', 'playerIndex']),
        query: JSON.stringify(req.query),
        body: JSON.stringify(req.body),
        gameData: JSON.stringify(req.gameData),
        error: error
    });
}

module.exports = {
    serverError,
}