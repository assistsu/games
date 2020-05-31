const jwt = require('jsonwebtoken');
const Config = require('../config');

class JWT {
    static sign(data) {
        return jwt.sign(data, Config.JWT_SECRET_KEY);
    }

    static verify(token) {
        return jwt.verify(token, Config.JWT_SECRET_KEY);
    }
}

module.exports = JWT;