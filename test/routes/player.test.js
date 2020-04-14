const request = require('supertest');
const sinon = require('sinon');
const mongodb = require('../../model/mongodb');
const PlayerData = require('../TestData/player.data');
const jwt = require('../../utils/jwt');
const responses = require('../../utils/responses');

const app = request(require('../../app'));

describe('Player apis tests', function () {
    const basepath = '/api/v1/player';
    afterEach(done => {
        sinon.restore();
        done();
    });
    describe('create api tests', function () {
        it('with valid playerName', () => {
            sinon.stub(mongodb, 'insertOne').resolves(PlayerData.NEW_PLAYER);
            const expectedBody = { ...PlayerData.NEW_PLAYER.ops[0], token: jwt.sign(PlayerData.NEW_PLAYER.ops[0]) };
            return app.post(basepath + '/new').send({ playerName: 'sangam' }).expect(200, expectedBody);
        });
        it('with no playerName', () => {
            return app.post(basepath + '/new').expect(400, responses.EMPTY_PLAYER_NAME);
        });
        it('with empty playerName', () => {
            return app.post(basepath + '/new').send({ playerName: '' }).expect(400, responses.EMPTY_PLAYER_NAME);
        });
        it('with more than 15 chars in playerName', () => {
            return app.post(basepath + '/new').send({ playerName: '1234567890abcdef' }).expect(400, responses.EXCEEDED_PLAYER_NAME);
        });
        it('with stubbing mongodb call', () => {
            return app.post(basepath + '/new').send({ playerName: 'sangam' }).expect(500, responses.SERVER_ERROR);
        });
    });
});