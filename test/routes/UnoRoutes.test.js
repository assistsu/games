const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const UnoTestData = require('../TestData/UnoTestData.spec');
const { responses } = require('../../utils/ResponseUtil');
const UnoUtil = require('../../utils/UnoUtil');

describe('Uno apis tests', function () {
    const app = request(require('../../app'));
    afterEach(done => {
        sinon.restore();
        done();
    });
    const basepath = '/api/v1/uno';
    describe('Start game api tests', function () {
        it('Game not created', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_CREATED);
        });
        it('Not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGame2PlayersData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(401, responses.NOT_AN_ADMIN)
        });
        it('Player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGame2PlayersData());
            const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200)
                .then(() => {
                    const { $set } = updateByIdStub.args[0][2];
                    const cards = UnoUtil.getCards();
                    expect($set.status).equal('STARTED');
                    expect($set.playersCards['123'].length).equal(7);
                    expect($set.playersCards['abc'].length).equal(7);
                    expect(cards).to.deep.include.members($set.playersCards['123']);
                    expect(cards).to.deep.include.members($set.playersCards['abc']);
                    expect($set.playersCards['123']).to.deep.not.include.members($set.playersCards['abc']);
                    expect($set.lastCard).to.be.an('object');
                    expect($set.startedBy).to.eql({ _id: '123' });
                    expect($set.updatedBy).to.eql({ _id: '123' });
                    expect($set.updatedAt).to.be.an('date');
                    expect($set.inc).equal(1);
                    const data = UnoTestData.getStartedGameData();
                    expect(data.players).to.have.deep.include(_.pick($set.currentPlayer, '_id'));
                });
        });
        it('Only one player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.MIN_PLAYERS_NOT_PRESENT());
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGame2PlayersData());
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
    describe('Submit card api tests', function () {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        describe('My move', function () {
            it('Without chosencard', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('Invalid card color', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { color: 'spade' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('Invalid card type', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { color: 'blue', type: '12' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('Not my card', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { color: 'primary', type: '5' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            describe('My card', () => {
                it('Valid card but not matched with last card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'success', type: '1' } })
                        .expect(400, responses.CHOSEN_CARD_NOT_MATCHED);
                });
                it('normal card and color matches', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: '1' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: '1' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameData().playersInGame[2]);
                            expect($set.playersCards['xyz'].length).equal(0);
                        });
                });
                it('normal card and number matches', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'success', type: '2' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'success', type: '2' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameData().playersInGame[2]);
                            expect($set.playersCards['xyz'].length).equal(0);
                        });
                });
                it('normal card and last card is wild card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameWithLastCardWildCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: '1' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: '1' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameWithLastCardWildCardData().playersInGame[2]);
                            expect($set.playersCards['xyz'].length).equal(0);
                        });
                });
                it('normal card and last before card and forgot uno', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameMyLastBeforeCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: '1' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: '1' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameMyLastBeforeCardData().playersInGame[2]);
                            expect($set.playersCards['xyz'].length).equal(0);
                            expect($set.playersCards['abc'].length).equal(3);
                        });
                });
                it('normal card and last before card and clicked uno', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameMyLastBeforeCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: '1' }, isUnoClicked: "true" })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: '1' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameMyLastBeforeCardData().playersInGame[2]);
                            expect($set.playersCards['xyz'].length).equal(0);
                            expect($set.playersCards['abc'].length).equal(1);
                        });
                });
                it('normal card and last card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameMyLastCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: '1' }, isUnoClicked: "true" })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.status).equal('ENDED');
                            expect($set.lastCard).to.eql({ color: 'primary', type: '1' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.playersCards['xyz'].length).equal(0);
                            expect($set.playersCards['abc'].length).equal(0);
                        });
                });
                it('reverse card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: 'REVERSE_CARD' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: 'REVERSE_CARD' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(-1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameData().playersInGame[0]);
                            expect($set.playersCards['xyz'].length).equal(0);
                        });
                });
                it('skip card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: 'SKIP_CARD' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: 'SKIP_CARD' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameData().playersInGame[0]);
                            expect($set.playersCards['xyz'].length).equal(0);
                        });
                });
                it('+2 card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: 'DRAW_TWO_CARDS' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'primary', type: 'DRAW_TWO_CARDS' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.playersCards['xyz'].length).equal(2);
                            const data = UnoTestData.getStartedGameData();
                            expect($set.currentPlayer).to.eql(data.playersInGame[0]);
                        });
                });
                it('+4 card without chosenColor', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS' } })
                        .expect(400, responses.CHOSEN_COLOR_NOT_PRESENT);
                });
                it('+4 card invalid chosenColor', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS', chosenColor: 'dummy' } })
                        .expect(400, responses.INVALID_CHOSEN_COLOR);
                });
                it('+4 card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS', chosenColor: 'primary' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS', chosenColor: 'primary' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.playersCards['xyz'].length).equal(4);
                            const data = UnoTestData.getStartedGameData();
                            expect($set.currentPlayer).to.eql(data.playersInGame[0]);
                        });
                });
                it('color change card', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'dark', type: 'WILD_CARD', chosenColor: 'primary' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set.lastCard).to.eql({ color: 'dark', type: 'WILD_CARD', chosenColor: 'primary' });
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.inc).equal(1);
                            expect($set.playersCards['xyz'].length).equal(0);
                            const data = UnoTestData.getStartedGameData();
                            expect($set.currentPlayer).to.eql(data.playersInGame[2]);
                        });
                });
                it('Mongodb error', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdSpy = sinon.spy(mongodb, 'updateById');
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { color: 'primary', type: '1' } })
                        .expect(500, responses.SERVER_ERROR)
                        .then(() => {
                            expect(updateByIdSpy.calledOnce).equal(true);
                            expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                        });
                });
            });
        });
    });
    describe('Take card api tests', function () {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            const updateByIdSpy = sinon.spy(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/take')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(500, responses.SERVER_ERROR)
                .then(() => {
                    expect(updateByIdSpy.calledOnce).equal(true);
                    expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                });
        });
        describe('My move', function () {
            it('second time', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameWithPassData());
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.PLAYER_TOOK_CARD_ALREADY);
            });
            it('first time', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/take')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set.currentPlayer.pass).equal(true);
                    });
            });
        });
    });
    describe('Pass card api tests', function () {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/pass')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/pass')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/pass')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameWithPassData());
            const updateByIdSpy = sinon.spy(mongodb, 'updateById');
            return app.post(basepath + '/123456789012/pass')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(500, responses.SERVER_ERROR)
                .then(() => {
                    expect(updateByIdSpy.calledOnce).equal(true);
                    expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                });
        });
        describe('My move', function () {
            it('Did not took card', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/pass')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.PLAYER_CANT_PASS);
            });
            it('Took time', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameWithPassData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/pass')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set.currentPlayer.pass).to.not.exist;
                        expect($set.currentPlayer).to.eql(UnoTestData.getStartedGameData().playersInGame[2]);
                    });
            });
        });
    });
    describe("[Leave game api tests]", () => {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/leave')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        describe('[Game status is created]', () => {
            it('Not an admin', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGame2PlayersData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy']);
                        expect($set.players).to.not.deep.include({ _id: 'abc' });
                    });
            });
            it('I am admin', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGame2PlayersData());
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
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'deck']);
                        expect($set.players).to.not.deep.include({ _id: 'xyz' });
                    });
            });
            describe('[Current player]', () => {
                it('Positioned as Not last player', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'deck', 'currentPlayer']);
                            expect($set.players).to.not.deep.include({ _id: 'abc' });
                            expect($set.currentPlayer).to.eql({ _id: 'xyz' });
                        });
                });
                it('Positioned as Last Player', () => {
                    sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGameCurrPlayerXYZData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'deck', 'currentPlayer']);
                            expect($set.players).to.not.deep.include({ _id: 'xyz' });
                            expect($set.currentPlayer).to.eql({ _id: '123' });
                        });
                });
            });
            it('Only two player exists', () => {
                sinon.stub(mongodb, 'findById').resolves(UnoTestData.getStartedGame2PlayerData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['players', 'updatedAt', 'updatedBy', 'status']);
                        expect($set.players).to.not.deep.include({ _id: 'abc' });
                        expect($set.status).to.equal('ENDED');
                    });
            });
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(UnoTestData.getCreatedGame2PlayersData());
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