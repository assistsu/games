const jwt = require('jsonwebtoken');
const Config = require('../config');

exports.sign = function (data) {
    return jwt.sign(data, Config.JWT_SECRET_KEY);
}

exports.verify = function (token) {
    return jwt.verify(token, Config.JWT_SECRET_KEY);
}