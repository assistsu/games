const { expect } = require('chai');
const request = require('request');
const Config = require('../config');

describe('Uno get game info api tests', function () {
    it('get game info without user payload', function (done) {
        request('http://localhost:8080/api/v1/game/uno/id/info', function (error, response, body) {
            expect(response.statusCode).to.equal(401);
            done();
        });
    });
    it('get game info with user payload and invalid room id', function (done) {
        request({ url: 'http://localhost:8080/api/v1/game/uno/id/info', headers: { 'x-player-token': jwt.sign({ _id: '123' }, Config.JWT_SECRET_KEY) } }, function (error, response, body) {
            expect(response.statusCode).to.equal(400);
            done();
        });
    });
})