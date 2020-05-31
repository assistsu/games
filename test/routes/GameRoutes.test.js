const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const CommonGameTestData = require('../TestData/CommonGameTestData.spec');
const { responses } = require('../../utils/ResponseUtil');

const app = request(require('../../app'));

describe('Common Game APIs tests', function () {
    afterEach(done => {
        sinon.restore();
        done();
    });
    const basepath = '/api/v1/game';
    describe("Player Authentication", () => {
        it("Without player token", () => {
            return app.post(basepath).expect(401, responses.INVALID_PLAYER_TOKEN);
        });
        it("Invalid player token", () => {
            return app.post(basepath)
                .set('x-player-token', 'dummy')
                .expect(401, responses.INVALID_PLAYER_TOKEN);
        });
        it("Valid player token", () => {
            return app.post(basepath)
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.INVALID_GAME_NAME);
        });
    });
    describe("Game Name Validation", () => {
        it("Without game name", () => {
            return app.post(basepath)
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.INVALID_GAME_NAME);
        });
        it("Invalid game name", () => {
            return app.post(basepath)
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'dummy' })
                .expect(400, responses.INVALID_GAME_NAME);
        });
        it("[POST] Valid game name", () => {
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'uno' })
                .expect(400, responses.INVALID_ROOM_NAME_TYPE);
        });
        it("[GET] Valid game name", () => {
            return app.get(basepath + '/id/info?gameName=uno')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.INVALID_ROOM_ID);
        });
    });
    describe("Get game info api tests", () => {
        it('With invalid room id', () => {
            return app.get(basepath + '/id/info?gameName=uno')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.INVALID_ROOM_ID);
        });
        it('Room not found', () => {
            sinon.stub(mongodb, 'findById').resolves(null);
            return app.get(basepath + '/123456789012/info?gameName=uno')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(404, responses.ROOM_NOT_FOUND);
        });
        it('With valid data', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            return app.get(basepath + '/123456789012/info?gameName=uno')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200, CommonGameTestData.getCreatedGameData());
        });
        it('Mongodb error', () => {
            return app.get(basepath + '/123456789012/info?gameName=uno')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Create game api tests', function () {
        it('Without roomName', () => {
            const data = CommonGameTestData.getCreatedGameData();
            sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'uno' })
                .expect(400, responses.INVALID_ROOM_NAME_TYPE);
        });
        it('With empty roomName', () => {
            const data = CommonGameTestData.getCreatedGameData();
            sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .send({ gameName: 'uno', roomName: '' })
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.EMPTY_ROOM_NAME);
        });
        it('With roomName contains space only', () => {
            const data = CommonGameTestData.getCreatedGameData();
            sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .send({ gameName: 'uno', roomName: '   ' })
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.EMPTY_ROOM_NAME);
        });
        it('With roomName exceeds limit', () => {
            const data = CommonGameTestData.getCreatedGameData();
            sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .send({ gameName: 'uno', roomName: '1234567890123456' })
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.ROOM_NAME_LENGTH_EXCEEDED);
        });
        it('Uno -> With valid roomName', () => {
            const data = CommonGameTestData.getCreatedGameData();
            const insertOneStub = sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .send({ gameName: 'uno', roomName: 'dummy' })
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200, { _id: data._id })
                .then(() => {
                    const actualInsertObj = _.omit(insertOneStub.args[0][1], ['createdAt', 'updatedAt']);
                    const expectedInsertObj = {
                        roomName: 'dummy',
                        status: 'CREATED',
                        players: [{ _id: '123' }],
                        admin: { _id: '123' },
                        messages: [],
                        createdBy: { _id: '123' },
                        updatedBy: { _id: '123' },
                        minPlayers: 2,
                        maxPlayers: 10,
                    }
                    expect(expectedInsertObj).to.deep.equal(actualInsertObj);
                });
        });
        it('Ass -> With valid roomName', () => {
            const data = CommonGameTestData.getCreatedGameData();
            const insertOneStub = sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .send({ gameName: 'ass', roomName: 'dummy' })
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200, { _id: data._id })
                .then(() => {
                    const actualInsertObj = _.omit(insertOneStub.args[0][1], ['createdAt', 'updatedAt']);
                    const expectedInsertObj = {
                        roomName: 'dummy',
                        status: 'CREATED',
                        players: [{ _id: '123' }],
                        admin: { _id: '123' },
                        messages: [],
                        createdBy: { _id: '123' },
                        updatedBy: { _id: '123' },
                        minPlayers: 2,
                        maxPlayers: 13,
                    }
                    expect(expectedInsertObj).to.deep.equal(actualInsertObj);
                });
        });
        it('Leastcount -> With valid roomName', () => {
            const data = CommonGameTestData.getCreatedGameData();
            const insertOneStub = sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .send({ gameName: 'leastcount', roomName: 'dummy' })
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200, { _id: data._id })
                .then(() => {
                    const actualInsertObj = _.omit(insertOneStub.args[0][1], ['createdAt', 'updatedAt']);
                    const expectedInsertObj = {
                        roomName: 'dummy',
                        status: 'CREATED',
                        players: [{ _id: '123' }],
                        admin: { _id: '123' },
                        messages: [],
                        createdBy: { _id: '123' },
                        updatedBy: { _id: '123' },
                        minPlayers: 2,
                        maxPlayers: 16,
                    }
                    expect(expectedInsertObj).to.deep.equal(actualInsertObj);
                });
        });
        it('Mongodb error', () => {
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'uno', roomName: 'dummy' })
                .expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Join room api tests', function () {
        it('Player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/join')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'uno' })
                .expect(200, responses.PLAYER_FOUND_IN_ROOM);
        });
        it('Player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/join')
                .set('x-player-token', jwt.sign({ _id: '1234' }))
                .send({ gameName: 'uno' })
                .expect(200);
        });
        it('Player tries to join in full room', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameRoomFullData());
            return app.post(basepath + '/123456789012/join')
                .set('x-player-token', jwt.sign({ _id: '1234' }))
                .send({ gameName: 'ass' })
                .expect(400, responses.ROOM_IS_FULL);
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/join')
                .set('x-player-token', jwt.sign({ _id: '1234' }))
                .send({ gameName: 'uno' })
                .expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Restart game api tests', function () {
        it('Non admin tries to restart', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/restart')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ gameName: 'uno' })
                .expect(401, responses.NOT_AN_ADMIN);
        });
        describe('I am admin', () => {
            it('Restart not an ended game', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                return app.post(basepath + '/123456789012/restart')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno' })
                    .expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
            });
            it('Restart a ended game', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getEndedGameData());
                sinon.stub(mongodb, 'updateById').resolves(CommonGameTestData.getCreatedGameData());
                sinon.stub(mongodb, 'insertOne').resolves(CommonGameTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/restart')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno' })
                    .expect(200);
            });
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getEndedGameData());
            return app.post(basepath + '/123456789012/restart')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'uno' })
                .expect(500, responses.SERVER_ERROR);
        });
        it('Mongodb error on storig ended game data', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getEndedGameData());
            sinon.stub(mongodb, 'updateById').resolves(CommonGameTestData.getCreatedGameData());
            const insertOneSpy = sinon.spy(mongodb, 'insertOne');
            return app.post(basepath + '/123456789012/restart')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .send({ gameName: 'uno' })
                .expect(200)
                .then(() => {
                    expect(insertOneSpy.calledOnce).equal(true);
                    // expect(insertOneSpy).to.throws("Cannot read property 'collection' of null");
                });
        });
    });
    describe('[Send message api tests]', function () {
        it('Player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/message')
                .set('x-player-token', jwt.sign({ _id: '1234' }))
                .send({ gameName: 'uno' })
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        describe('[Player exist in room]', () => {
            it('With out message', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                sinon.stub(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/message')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno' })
                    .expect(400, responses.INVALID_MESSAGE_TYPE);
            });
            it('Message contains only space', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                sinon.stub(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/message')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', text: '   ' })
                    .expect(400, responses.EMPTY_MESSAGE);
            });
            it('Message exceeds limit', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                sinon.stub(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/message')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', text: Array(201).fill('a').join('') })
                    .expect(400, responses.MESSAGE_LENGTH_EXCEED);
            });
            it('Valid message', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                sinon.stub(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/message')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', text: 'message' })
                    .expect(200);
            });
            it('Mongodb error', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                return app.post(basepath + '/123456789012/message')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', text: 'message' })
                    .expect(500, responses.SERVER_ERROR);
            });
        });
    });
    describe('[Nudge api tests]', function () {
        it('Non admin tries to nudge', () => {
            sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/nudge')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ gameName: 'uno' })
                .expect(401, responses.NOT_AN_ADMIN);
        });
        describe('[I am admin]', () => {
            it('Nudge myself', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                return app.post(basepath + '/123456789012/nudge')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', playerId: '123' })
                    .expect(400, responses.NUDGING_HIMSELF);
            });
            it('Player to nudge is not present in Room', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                return app.post(basepath + '/123456789012/nudge')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', playerId: '1234' })
                    .expect(400, responses.NUDGE_PLAYER_NOT_IN_ROOM);
            });
            it('Player to nudge is present', () => {
                sinon.stub(mongodb, 'findById').resolves(CommonGameTestData.getCreatedGameData());
                return app.post(basepath + '/123456789012/nudge')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .send({ gameName: 'uno', playerId: 'abc' })
                    .expect(200);
            });
        });
    });
});