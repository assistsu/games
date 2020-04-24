const request = require('supertest');
const sinon = require('sinon');
const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const UnoData = require('../TestData/uno.data');
const responses = require('../../utils/responses');

const app = request(require('../../app'));

describe('Uno apis tests', function () {
    const basepath = '/api/v1/game/uno';
    afterEach(done => {
        sinon.restore();
        done();
    });
    it('invalid path', () => {
        return app.get(basepath + '/path').set('x-player-token', jwt.sign({ _id: '123' })).expect(404);
    });
    it('without player token', () => {
        return app.get(basepath + '/id/info').expect(401, responses.INVALID_PLAYER_TOKEN);
    });
    it('with invalid player token', () => {
        return app.get(basepath + '/id/info').set('x-player-token', 'aaaaaaaabbbbbcd').expect(401, responses.INVALID_PLAYER_TOKEN);
    });
    describe("Get game info api tests", () => {
        it('with invalid room id', () => {
            return app.get(basepath + '/id/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.INVALID_ROOM_ID);
        });
        it('room not found', () => {
            sinon.stub(mongodb, 'findById').resolves(null);
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(404, responses.ROOM_NOT_FOUND);
        });
        it('with valid data', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.STARTED_GAME);
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(200, UnoData.STARTED_GAME);
        });
        it('without stubbing', () => {
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Submit card api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.STARTED_GAME);
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '124' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.ENDED_GAME);
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.STARTED_GAME);
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(401, responses.NOT_YOUR_MOVE);
        });
        it('without stubbing', () => {
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Start game api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.STARTED_GAME);
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '124' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not created', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.ENDED_GAME);
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_CREATED);
        });
        it('not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: 'abc' })).expect(401, responses.NOT_AN_ADMIN)
        });
        it('player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            sinon.stub(mongodb, 'updateById').resolves(UnoData.STARTED_GAME);
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
    });
    describe('Join room api tests', function () {
        it('player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '123' })).expect(200, responses.PLAYER_FOUND_IN_ROOM);
        });
        it('player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(200, {});
        });
        it('player tries to join in full room', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME_FILLED);
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(400, responses.ROOM_IS_FULL);
        });
    });
    describe('Restart game api tests', function () {
        it('player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '1234' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('player exist in room but not a admin', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: 'abc' })).expect(401, responses.NOT_AN_ADMIN);
        });
        it('admin tries to restart a created game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.CREATED_GAME);
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
        });
        it('admin tries to restart a started game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.STARTED_GAME);
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
        });
        it('admin tries to restart a ended game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoData.ENDED_GAME);
            sinon.stub(mongodb, 'updateById').resolves(UnoData.CREATED_GAME);
            sinon.stub(mongodb, 'insertOne').resolves(UnoData.STARTED_GAME);
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
    });
});