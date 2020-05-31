const _ = require('lodash');
const log4js = require('log4js');

log4js.configure({
    appenders: {
        everything: { type: 'file', filename: 'logs/application.log' }
    },
    categories: {
        default: { appenders: ['everything'], level: 'ALL' },
    }
});

const error500 = log4js.getLogger('error-500');

class Logger {
    static error500(req, error) {
        error500.error({
            commonInfo: {
                ..._.pick(req, ['originalUrl', 'method', 'params', 'player', 'playerIndex']),
                query: JSON.stringify(req.query),
                body: JSON.stringify(req.body),
                gameData: JSON.stringify(req.gameData),
            },
            errorInfo: error,
        });
    }
}

module.exports = Logger;