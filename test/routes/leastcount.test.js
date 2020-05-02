const request = require('supertest');
const sinon = require('sinon');
const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const LeastCountData = require('../TestData/leastcount.spec');
const responses = require('../../utils/responses');

const app = request(require('../../app'));

describe('Least count apis tests', function () {
    const basepath = '/api/v1/game/leastcount';
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
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
        it('with invalid fields', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameInvalidFieldsData());
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(500);
        });
        it('mongodb not connected', () => {
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Submit card api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '124' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(401, responses.NOT_YOUR_MOVE);
        });
        it('my move and with invalid card type', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'spade' }] })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and with invalid card number < 2', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ number: 1 }] })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and with invalid card number > 14', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ number: 15 }] })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and passing not my card', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'SPADE', number: 5 }] })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move with my cards > 1 and one not my card', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'SPADE', number: 13 }, { type: 'SPADE', number: 1 }] })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move with my cards > 1 and one not valid card', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'SPADE', number: 13 }, { type: 'SPADE', number: 0 }] })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move with my cards > 1 and not same number cards', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'SPADE', number: 13 }, { type: 'HEART', number: 2 }] })
                .expect(400, responses.NOT_SAME_NUMBERS);
        });
        it('my move with my card', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'SPADE', number: 13 }] })
                .expect(200);
        });
        it('my move with my cards > 1 and same number cards', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'HEART', number: 2 }, { type: 'SPADE', number: 2 },] })
                .expect(200);
        });
        it('mongodb not connected', () => {
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(500, responses.SERVER_ERROR);
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCards: [{ type: 'HEART', number: 2 }] })
                .expect(500);
        });
    });
    describe('Take api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        it('trying to take while action is SUBMIT', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.PLAYER_ACTION_NOT_TAKE);
        });
        it('trying to take while action is DECIDE', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.PLAYER_ACTION_NOT_TAKE);
        });
        it('trying to take without takeFrom', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400,responses.INVALID_TAKE_FROM);
        });
        it('trying to take with invalid takeFrom', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ takeFrom: 'SOMETHING' })
                .expect(400,responses.INVALID_TAKE_FROM);
        });
        it('trying to take from deck', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ takeFrom: 'DECK' })
                .expect(200);
        });
        it('trying to take from lastcard', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ takeFrom: 'LASTCARD' })
                .expect(200);
        });
        it('mongodb not connected', () => {
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR);
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/take-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ takeFrom: 'DECK' })
                .expect(500, responses.SERVER_ERROR);
        });
    });
    describe('No Show api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        it('trying to no show while action is SUBMIT', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.PLAYER_ACTION_NOT_DECIDE);
        });
        it('trying to no show while action is TAKE', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.PLAYER_ACTION_NOT_DECIDE);
        });
        it('trying to no show while action is DECIDE', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(200);
        });
        it('mongodb not connected', () => {
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR);
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Show Cards api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        it('trying to show cards while action is SUBMIT', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.PLAYER_ACTION_NOT_DECIDE);
        });
        it('trying to show cards while action is TAKE', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedTakeActionGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.PLAYER_ACTION_NOT_DECIDE);
        });
        it('trying to show cards and it bads show', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(200);
        });
        it('trying to show cards and its good show', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGoodShowGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedDecideActionGoodShowGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(200);
        });
        it('trying to show cards and its good show and not first time', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGoodShowNotFirstGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedDecideActionGoodShowNotFirstGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(200);
        });
        it('mongodb not connected', () => {
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR);
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/show-cards')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Create game api tests', function () {
        it('player creates room', () => {
            const data = LeastCountData.getCreatedGameData();
            sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200, { _id: data._id });
        });
        it('mongodb not connected', () => {
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500);
        });
    });
    describe('Start game api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '124' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not created', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_CREATED);
        });
        it('not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: 'abc' })).expect(401, responses.NOT_AN_ADMIN)
        });
        it('only one player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameOnePlayerExistData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.CANT_START_GAME);
        });
        it('player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(500);
        });
    });
    describe('Join room api tests', function () {
        it('player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '123' })).expect(200, responses.PLAYER_FOUND_IN_ROOM);
        });
        it('player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(200, {});
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(500);
        });
    });
    describe('Restart game api tests', function () {
        it('player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '1234' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('non admin tries to restart', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: 'abc' })).expect(401, responses.NOT_AN_ADMIN);
        });
        it('admin tries to restart a created game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getCreatedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
        });
        it('admin tries to restart a started game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
        });
        it('admin tries to restart a ended game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            sinon.stub(mongodb, 'updateById').resolves(LeastCountData.getCreatedGameData());
            sinon.stub(mongodb, 'insertOne').resolves(LeastCountData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
        it('mongodb got disconnected before updating', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountData.getEndedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(500);
        });
    });
});