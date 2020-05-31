const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const LeastCountTestData = require('../TestData/LeastCountTestData.spec');
const { responses } = require('../../utils/ResponseUtil');
const LeastCountUtil = require('../../utils/LeastCountUtil');
const GameUtil = require('../../utils/GameUtil');

describe('Least count apis tests', function () {
    const app = request(require('../../app'));
    afterEach(done => {
        sinon.restore();
        done();
    });
    const basepath = '/api/v1/leastcount';
    describe('Start game api tests', function () {
        it('Game not created', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_CREATED);
        });
        it('Not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGame2PlayersData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(401, responses.NOT_AN_ADMIN)
        });
        it('Only one player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.MIN_PLAYERS_NOT_PRESENT());
        });
        it('Player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGame2PlayersData());
            const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200)
                .then(() => {
                    const { $set } = updateByIdStub.args[0][2];
                    const cards = GameUtil.getStandardDeck(LeastCountUtil.pointMapper);
                    expect($set.status).equal('STARTED');
                    expect($set.playersCards['123'].length).equal(7);
                    expect($set.playersCards['abc'].length).equal(7);
                    expect(cards).to.deep.include.members($set.playersCards['123']);
                    expect(cards).to.deep.include.members($set.playersCards['abc']);
                    expect($set.playersCards['123']).to.deep.not.include.members($set.playersCards['abc']);
                    expect($set.startedBy).to.eql({ _id: '123' });
                    expect($set.updatedBy).to.eql({ _id: '123' });
                    expect($set.updatedAt).to.be.an('date');
                    const data = LeastCountTestData.getCreatedGame2PlayersData();
                    expect(data.players).to.have.deep.include(_.pick($set.currentPlayer, '_id'));
                });
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGame2PlayersData());
            const updateByIdSpy = sinon.spy(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR)
                .then(() => {
                    expect(updateByIdSpy.calledOnce).equal(true);
                    expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                });
        });
    });
    describe('Show Cards api tests', function () {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/show')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        describe('My move', function () {
            it('Action is not DECIDE', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.PLAYER_ACTION_NOT_DECIDE);
            });
            it('Bad show', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200);
            });
            it('Good show', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGoodShowGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200);
            });
            it('Bad show and second time', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionSecondRoundGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200);
            });
            it('Mongodb error', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
                const updateByIdSpy = sinon.spy(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(500, responses.SERVER_ERROR)
                    .then(() => {
                        expect(updateByIdSpy.calledOnce).equal(true);
                        expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                    });
            });
        });
    });
    describe('No Show api tests', function () {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
            return app.post(basepath + '/123456789012/no-show')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        describe('My move', function () {
            it('Action is not decide SUBMIT', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/no-show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.PLAYER_ACTION_NOT_DECIDE);
            });
            it('Action is DECIDE', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/no-show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200);
            });
            it('Mongodb error', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
                const updateByIdSpy = sinon.spy(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/no-show')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(500, responses.SERVER_ERROR)
                    .then(() => {
                        expect(updateByIdSpy.calledOnce).equal(true);
                        expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                    });
            });
        });
    });
    describe('Submit card api tests', function () {
        it('player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        describe('My move', function () {
            it('Action is not SUBMIT', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedDecideActionGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'SPADE', number: 13 }] })
                    .expect(400, responses.PLAYER_ACTION_NOT_SUBMIT);
            });
            it('Without chosencard', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.EMPTY_CHOSEN_CARDS);
            });
            it('With invalid card type', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'spade' }] })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('With invalid card number < 2', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ number: 1 }] })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('With invalid card number > 14', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ number: 15 }] })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('Not my card', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'SPADE', number: 5 }] })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('2 Chosen cards and one not my card', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'SPADE', number: 13 }, { type: 'SPADE', number: 1 }] })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('2 Chosen cards > 1 and one not valid card', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'SPADE', number: 13 }, { type: 'SPADE', number: 0 }] })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('2 Chosen cards > 1 and not same number cards', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'SPADE', number: 13 }, { type: 'HEART', number: 2 }] })
                    .expect(400, responses.NOT_SAME_NUMBERS);
            });
            it('1 Chosen cards', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'SPADE', number: 13 }] })
                    .expect(200);
            });
            it('2 Chosen cards and same number cards', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'HEART', number: 2 }, { type: 'SPADE', number: 2 },] })
                    .expect(200);
            });
            it('Mongodb error', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                const updateByIdSpy = sinon.spy(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCards: [{ type: 'HEART', number: 2 }] })
                    .expect(500, responses.SERVER_ERROR)
                    .then(() => {
                        expect(updateByIdSpy.calledOnce).equal(true);
                        expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                    });
            });
        });
    });
    describe('Take api tests', function () {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        describe('My move', function () {
            it('Action is not TAKE', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.PLAYER_ACTION_NOT_TAKE);
            });
            it('Without takeFrom', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedTakeActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.INVALID_TAKE_FROM);
            });
            it('With invalid takeFrom', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedTakeActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ takeFrom: 'SOMETHING' })
                    .expect(400, responses.INVALID_TAKE_FROM);
            });
            it('Take from deck', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedTakeActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ takeFrom: 'DECK' })
                    .expect(200);
            });
            it('Take from lastcard', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedTakeActionGameData());
                sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ takeFrom: 'LASTCARD' })
                    .expect(200);
            });
            it('Mongodb error', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedTakeActionGameData());
                const updateByIdSpy = sinon.spy(mongodb, 'updateById');
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ takeFrom: 'DECK' })
                    .expect(500, responses.SERVER_ERROR)
                    .then(() => {
                        expect(updateByIdSpy.calledOnce).equal(true);
                        expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                    });
            });
        });
    });
    describe('Continue game api tests', function () {
        it('No player showed', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedSubmitActionGameData());
            return app.post(basepath + '/123456789012/continue')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_PLAYER_SHOWED);
        });
        it('Not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getPlayerShowedGameData());
            return app.post(basepath + '/123456789012/continue')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(401, responses.NOT_AN_ADMIN)
        });
        it('Only one player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getPlayerShowed1PlayerGameData());
            return app.post(basepath + '/123456789012/continue')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.MIN_PLAYERS_NOT_PRESENT());
        });
        it('Player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getPlayerShowedGameData());
            const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/continue')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200)
                .then(() => {
                    const { $set } = updateByIdStub.args[0][2];
                    const cards = GameUtil.getStandardDeck(LeastCountUtil.pointMapper);
                    expect($set.status).equal('STARTED');
                    expect($set.playersCards['123'].length).equal(7);
                    expect($set.playersCards['abc'].length).equal(7);
                    expect(cards).to.deep.include.members($set.playersCards['123']);
                    expect(cards).to.deep.include.members($set.playersCards['abc']);
                    expect($set.playersCards['123']).to.deep.not.include.members($set.playersCards['abc']);
                    expect($set.startedBy).to.eql({ _id: '123' });
                    expect($set.updatedBy).to.eql({ _id: '123' });
                    expect($set.updatedAt).to.be.an('date');
                    const data = LeastCountTestData.getPlayerShowedGameData();
                    expect(data.players).to.have.deep.include(_.pick($set.currentPlayer, '_id'));
                });
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getPlayerShowedGameData());
            const updateByIdSpy = sinon.spy(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/continue')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR)
                .then(() => {
                    expect(updateByIdSpy.calledOnce).equal(true);
                    expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                });
        });
    });
    describe("[Leave game api tests]", () => {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/leave')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        describe('[Game status is created]', () => {
            it('Not an admin', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGame2PlayersData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy',]);
                        expect($set.players).to.not.deep.include({ _id: 'abc' });
                    });
            });
            it('I am admin', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGame2PlayersData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'admin']);
                        expect($set.players).to.not.deep.include({ _id: '123' });
                        expect($set.admin).to.not.eql({ _id: '123' });
                    });
            });
        });
        describe('[Game status is started]', () => {
            it('Not a current player', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedGameData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'playersCards', 'playersPoints', 'playersTotalPoints', 'deck']);
                        expect($set.players).to.not.deep.include({ _id: 'xyz' });
                        expect($set.playersPoints).to.not.have.key('xyz');
                        expect($set.playersCards).to.not.have.key('xyz');
                    });
            });
            describe('[Current player]', () => {
                it('Positioned as Not last player', () => {
                    sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'playersCards', 'playersPoints', 'playersTotalPoints', 'deck', 'currentPlayer']);
                            expect($set.players).to.not.deep.include({ _id: 'abc' });
                            expect($set.currentPlayer).to.eql({ _id: 'xyz' });
                            expect($set.playersCards).to.not.have.key('abc');
                            expect($set.playersPoints).to.not.have.key('abc');
                        });
                });
                it('Positioned as Last Player', () => {
                    sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedGameCurrPlayerXYZData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'playersCards', 'playersPoints', 'playersTotalPoints', 'deck', 'currentPlayer']);
                            expect($set.players).to.not.deep.include({ _id: 'xyz' });
                            expect($set.currentPlayer).to.eql({ _id: '123' });
                            expect($set.playersCards).to.not.have.key('xyz');
                            expect($set.playersPoints).to.not.have.key('xyz');
                        });
                });
            });
            it('Only two player exists', () => {
                sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getStartedGame2PlayerData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'playersPoints', 'playersTotalPoints', 'status']);
                        expect($set.players).to.not.deep.include({ _id: 'abc' });
                        expect($set.status).to.equal('ENDED');
                    });
            });
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(LeastCountTestData.getCreatedGame2PlayersData());
            const updateByIdSpy = sinon.spy(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/leave')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(500, responses.SERVER_ERROR)
                .then(() => {
                    expect(updateByIdSpy.calledOnce).equal(true);
                    expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                });
        });
    });
});