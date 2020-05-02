const request = require('supertest');
const sinon = require('sinon');
const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const AssData = require('../TestData/ass.data');
const responses = require('../../utils/responses');

const app = request(require('../../app'));

describe('Ass apis tests', function () {
    const basepath = '/api/v1/game/ass';
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
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
        it('with invalid fields', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameInvalidFieldsData());
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(500);
        });
        it('without stubbing', () => {
            return app.get(basepath + '/123456789012/info').set('x-player-token', jwt.sign({ _id: '123' })).expect(500, responses.SERVER_ERROR);
        });
    });
    describe('Submit card api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '124' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getEndedGameData());
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(401, responses.NOT_YOUR_MOVE);
        });
        it('my move and with invalid card type', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'spade' } })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and with card number < 2', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { number: '1' } })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and with card number > 14', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { number: '15' } })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and passing not my card', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'SPADE', number: '5' } })
                .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
        });
        it('my move and with valid card and first card', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(200);
        });
        it('my move and with valid card and second card', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameRoundsNotFirstLastCardData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(200);
        });
        it('my move and with valid card and last card', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameRoundsLastCardData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(200);
        });
        it('my move and with valid card and game end', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameRoundsGameEndData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(200);
        });
        it('my move and with valid card and spoofing', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameRoundsLastCardData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'SPADE', number: 'A' } })
                .expect(400, responses.PLAYER_SPOOFING);
        });
        it('my move and with valid card and hitting', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameHittingData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'SPADE', number: 'A' } })
                .expect(200);
        });
        it('my move and my last card', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGamePlayerLastCardData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(200);
        });
        it('my move and my last card and ass in last match', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGamePlayerLastCardAssInLastGameData());
            sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(200);
        });
        it('without stubbing findById', () => {
            return app.post(basepath + '/123456789012/submit-card').set('x-player-token', jwt.sign({ _id: '123' })).expect(500, responses.SERVER_ERROR);
        });
        it('without stubbing updateById', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGamePlayerLastCardAssInLastGameData());
            return app.post(basepath + '/123456789012/submit-card')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .send({ chosenCard: { type: 'HEART', number: '2' } })
                .expect(500);
        });
    });
    describe('Create game api tests', function () {
        it('player creates room', () => {
            const data = AssData.getCreatedGameData();
            sinon.stub(mongodb, 'insertOne').resolves({ ops: [data] });
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200, { _id: data._id });
        });
        it('mongodb insertOne error', () => {
            return app.post(basepath + '/create')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500);
        });
    });
    describe('Start game api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '124' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('game not created', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getEndedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_CREATED);
        });
        it('not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: 'abc' })).expect(401, responses.NOT_AN_ADMIN)
        });
        it('only one player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameOnePlayerExistData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.CANT_START_GAME);
        });
        it('player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
        it('without stubbing', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start').set('x-player-token', jwt.sign({ _id: '123' })).expect(500);
        });
    });
    describe('Join room api tests', function () {
        it('player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '123' })).expect(200, responses.PLAYER_FOUND_IN_ROOM);
        });
        it('player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(200, {});
        });
        it('player tries to join in full room', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameRoomFullData());
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(400);
        });
        it('without stubbing updateById', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            return app.post(basepath + '/123456789012/join').set('x-player-token', jwt.sign({ _id: '1234' })).expect(500);
        });
    });
    describe('Restart game api tests', function () {
        it('player not exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            sinon.stub(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '1234' })).expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        it('non admin tries to restart', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: 'abc' })).expect(401, responses.NOT_AN_ADMIN);
        });
        it('admin tries to restart a created game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getCreatedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
        });
        it('admin tries to restart a started game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(400, responses.GAME_STATUS_IS_NOT_ENDED);
        });
        it('admin tries to restart a ended game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getEndedGameData());
            sinon.stub(mongodb, 'updateById').resolves(AssData.getCreatedGameData());
            sinon.stub(mongodb, 'insertOne').resolves(AssData.getStartedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(200);
        });
        it('without stubbing updateById', () => {
            sinon.stub(mongodb, 'findById').resolves(AssData.getEndedGameData());
            return app.post(basepath + '/123456789012/restart').set('x-player-token', jwt.sign({ _id: '123' })).expect(500);
        });
    });
});