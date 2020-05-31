const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const mongodb = require('../../model/mongodb');
const jwt = require('../../utils/jwt');
const AssTestData = require('../TestData/AssTestData.spec');
const { responses } = require('../../utils/ResponseUtil');
const AssUtil = require('../../utils/AssUtil');
const GameUtil = require('../../utils/GameUtil');

describe("[Ass apis tests]", () => {
    const app = request(require('../../app'));
    beforeEach(function () {
        // this.test.title = this.currentTest.fullTitle();
        // console.log(this.currentTest.fullTitle().split(']').join('] ->'));
    })
    afterEach(done => {
        sinon.restore();
        done();
    });
    const basepath = '/api/v1/ass';
    describe("[Start game api tests]", () => {
        it('Game not created', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_CREATED);
        });
        it('Not an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGame2PlayersData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                .expect(401, responses.NOT_AN_ADMIN)
        });
        it('Player is an admin', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGame2PlayersData());
            const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(200)
                .then(() => {
                    const { $set } = updateByIdStub.args[0][2];
                    const cards = GameUtil.getStandardDeck(AssUtil.pointMapper);
                    expect($set.status).equal('STARTED');
                    expect($set.playersCards['123'].length).equal(26);
                    expect($set.playersCards['abc'].length).equal(26);
                    expect(cards).to.deep.include.members($set.playersCards['123']);
                    expect(cards).to.deep.include.members($set.playersCards['abc']);
                    expect($set.playersCards['123']).to.deep.not.include.members($set.playersCards['abc']);
                    expect($set.startedBy).to.eql({ _id: '123' });
                    expect($set.updatedBy).to.eql({ _id: '123' });
                    expect($set.updatedAt).to.be.an('date');
                    expect(AssTestData.getStartedGameData().players).to.have.deep.include(_.pick($set.currentPlayer, '_id'));
                });
        });
        it('Only one player exist in room', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/start')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.MIN_PLAYERS_NOT_PRESENT());
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGame2PlayersData());
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
    describe("[Leave game api tests]", () => {
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/leave')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_ROOM);
        });
        describe('[Game status is created]', () => {
            it('Not an admin', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGame2PlayersData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy']);
                        expect($set.players).to.not.deep.include({ _id: 'abc' });
                    });
            });
            it('I am admin', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGame2PlayersData());
                const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                return app.post(basepath + '/123456789012/leave')
                    .set('x-player-token', jwt.sign({ _id: '123' }))
                    .expect(200)
                    .then(() => {
                        const { $set } = updateByIdStub.args[0][2];
                        expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'admin']);
                        expect($set.players).to.not.deep.include({ _id: '123' });
                        expect($set.admin).to.not.eql({ _id: '123' });
                    });
            });
        });
        describe('[Game status is started]', () => {
            describe('[Not a current player]', () => {
                it('My card not exists in currentRoundPlayerCards', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame']);
                            expect($set.players).to.not.deep.include({ _id: 'xyz' });
                            expect($set.playersInGame).to.not.deep.include({ _id: 'xyz' });
                        });
                });
                it('My card exists in currentRoundPlayerCards', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameMyLastCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentRoundPlayerCards']);
                            expect($set.players).to.not.deep.include({ _id: 'xyz' });
                            expect($set.playersInGame).to.not.deep.include({ _id: 'xyz' });
                            expect($set.currentRoundPlayerCards).to.not.have.key('xyz');
                        });
                });
            });
            describe('[Current player]', () => {
                it('Round second', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameRoundsSecondCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentPlayer']);
                            expect($set.players).to.not.deep.include({ _id: 'abc' });
                            expect($set.playersInGame).to.not.deep.include({ _id: 'abc' });
                            expect($set.currentPlayer).to.eql({ _id: 'xyz' });
                        });
                });
                describe('[Round first card]', () => {
                    describe('[Game first Card]', () => {
                        it('Not Poistioned as Last player', () => {
                            sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                            const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                            return app.post(basepath + '/123456789012/leave')
                                .set('x-player-token', jwt.sign({ _id: 'abc' }))
                                .expect(200)
                                .then(() => {
                                    const { $set } = updateByIdStub.args[0][2];
                                    expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentPlayer']);
                                    expect($set.players).to.not.deep.include({ _id: 'abc' });
                                    expect($set.playersInGame).to.not.deep.include({ _id: 'abc' });
                                    expect($set.currentPlayer).to.eql({ _id: 'xyz' });
                                });
                        });
                        it('Poistioned as Last player', () => {
                            sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameCurrentPlayerXYZData());
                            const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                            return app.post(basepath + '/123456789012/leave')
                                .set('x-player-token', jwt.sign({ _id: 'xyz' }))
                                .expect(200)
                                .then(() => {
                                    const { $set } = updateByIdStub.args[0][2];
                                    expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentPlayer']);
                                    expect($set.players).to.not.deep.include({ _id: 'xyz' });
                                    expect($set.playersInGame).to.not.deep.include({ _id: 'xyz' });
                                    expect($set.currentPlayer).to.eql({ _id: '123' });
                                });
                        });
                    });
                    it('Last round type is ALL_SUBMITTED', () => {
                        sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameLastRoundAllSubmittedData());
                        const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                        return app.post(basepath + '/123456789012/leave')
                            .set('x-player-token', jwt.sign({ _id: 'abc' }))
                            .expect(200)
                            .then(() => {
                                const { $set } = updateByIdStub.args[0][2];
                                expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentPlayer']);
                                expect($set.players).to.not.deep.include({ _id: 'abc' });
                                expect($set.playersInGame).to.not.deep.include({ _id: 'abc' });
                                expect($set.currentPlayer).to.eql({ _id: '123' });
                            });
                    });
                    it('Last round type is HIT', () => {
                        sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameOnlyRoundExist3PlayerHitData());
                        const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                        return app.post(basepath + '/123456789012/leave')
                            .set('x-player-token', jwt.sign({ _id: 'abc' }))
                            .expect(200)
                            .then(() => {
                                const { $set } = updateByIdStub.args[0][2];
                                expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentPlayer']);
                                expect($set.players).to.not.deep.include({ _id: 'abc' });
                                expect($set.playersInGame).to.not.deep.include({ _id: 'abc' });
                                expect($set.currentPlayer).to.eql({ _id: '123' });
                            });
                    });
                    it('Last round type is HIT and i put the first card and i got hit', () => {
                        sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameOnlyRoundExist2PlayerHitData());
                        const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                        return app.post(basepath + '/123456789012/leave')
                            .set('x-player-token', jwt.sign({ _id: 'abc' }))
                            .expect(200)
                            .then(() => {
                                const { $set } = updateByIdStub.args[0][2];
                                expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'currentPlayer']);
                                expect($set.players).to.not.deep.include({ _id: 'abc' });
                                expect($set.playersInGame).to.not.deep.include({ _id: 'abc' });
                                expect($set.currentPlayer).to.eql({ _id: 'xyz' });
                            });
                    });
                });
                it('Only two player exists', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameLastCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/leave')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            expect($set).to.have.all.keys(['assPlayers', 'players', 'updatedAt', 'updatedBy', 'playersInGame', 'status']);
                            expect($set.status).to.equal('ENDED');
                            expect($set.players).to.not.deep.include({ _id: 'abc' });
                            expect($set.playersInGame).to.not.deep.include({ _id: 'abc' });
                        });
                });
            });
        });
        it('Mongodb error', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGame2PlayersData());
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
    describe("[Submit card api tests]", () => {
        it('Game not started', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getCreatedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.GAME_STATUS_IS_NOT_STARTED);
        });
        it('Player not in the game', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '124' }))
                .expect(401, responses.PLAYER_NOT_FOUND_IN_GAME);
        });
        it('Not my move', () => {
            sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
            return app.post(basepath + '/123456789012/submit')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(401, responses.NOT_YOUR_MOVE);
        });
        describe("[My move]", () => {
            it('Without chosencard', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .expect(400, responses.INVALID_CARD);
            });
            it('With invalid card type', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { type: 'spade' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('With card number < 2', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { number: '1' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('With card number > 14', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { number: '15' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('Not my card', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { type: 'SPADE', number: '5' } })
                    .expect(400, responses.CHOSEN_CARD_NOT_PRESENT);
            });
            it('Spoofing', () => {
                sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameRoundsSecondCardData());
                return app.post(basepath + '/123456789012/submit')
                    .set('x-player-token', jwt.sign({ _id: 'abc' }))
                    .send({ chosenCard: { type: 'SPADE', number: 'A' } })
                    .expect(400, responses.PLAYER_SPOOFING);
            });
            describe("[Valid card]", () => {
                it('Round First card', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'HEART', number: '2' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            const expected_currentRoundPlayerCards = {
                                'abc': { type: 'HEART', number: '2', point: 2 },
                            };
                            expect($set.currentRoundPlayerCards).to.eql(expected_currentRoundPlayerCards);
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.currentPlayer).to.eql(AssTestData.getStartedGameData().playersInGame[2]);
                            expect($set.playersCards['abc']).to.have.deep.not.include({ type: 'HEART', number: '2' });
                        });
                });
                it('Round second card', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameRoundsSecondCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'HEART', number: '2' } })
                        .expect(200)
                        .then(() => {
                            const { $set } = updateByIdStub.args[0][2];
                            const expected_currentRoundPlayerCards = _.assign(AssTestData.getCurrentRoundPlayer1Cards(), {
                                'abc': { type: 'HEART', number: '2', point: 2 },
                            });
                            expect($set.currentRoundPlayerCards).to.eql(expected_currentRoundPlayerCards);
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.currentPlayer).to.eql(AssTestData.getStartedGameData().playersInGame[2]);
                            expect($set.playersCards['abc']).to.have.deep.not.include({ type: 'HEART', number: '2' });
                        });
                });
                it('All submitted', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameRoundLastCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'HEART', number: '2' } })
                        .expect(200)
                        .then(() => {
                            const { $set, $push } = updateByIdStub.args[0][2];
                            expect($set.currentRoundPlayerCards).to.eql({});
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.currentPlayer).to.eql(AssTestData.getStartedGameData().playersInGame[2]);
                            expect($set.playersCards['abc']).to.have.deep.not.include({ type: 'HEART', number: '2' });
                            const lastRoundData = {
                                type: 'ALL_SUBMITTED',
                                donePlayers: [],
                                playersCards: _.assign(AssTestData.getCurrentRoundPlayer2Cards(), {
                                    abc: { type: 'HEART', number: '2', point: 2 },
                                })
                            };
                            expect($push.rounds).to.eql(lastRoundData);
                        });
                });
                it('My last card and All submitted', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameMyLastCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'HEART', number: '2' } })
                        .expect(200)
                        .then(() => {
                            const { $set, $push } = updateByIdStub.args[0][2];
                            expect($set.currentRoundPlayerCards).to.eql({});
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.currentPlayer).to.eql(AssTestData.getStartedGameMyLastCardData().playersInGame[2]);
                            expect($set.playersCards).to.not.have.key('abc');
                            const lastRoundData = {
                                type: 'ALL_SUBMITTED',
                                donePlayers: [{ _id: 'abc' }],
                                playersCards: _.assign(AssTestData.getCurrentRoundPlayer2Cards(), {
                                    abc: { type: 'HEART', number: '2', point: 2 },
                                })
                            };
                            expect($push.rounds).to.eql(lastRoundData);
                        });
                });
                it('Game lastcard', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameLastCardData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'HEART', number: '2' } })
                        .expect(200)
                        .then(() => {
                            const { $set, $push } = updateByIdStub.args[0][2];
                            expect($set.status).equal('ENDED');
                            expect($set.currentRoundPlayerCards).to.eql({});
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.playersInGame).to.eql([{ _id: '123' }]);
                            const lastRoundData = {
                                type: 'ALL_SUBMITTED',
                                donePlayers: [{ _id: 'abc' }],
                                playersCards: _.assign(AssTestData.getCurrentRoundPlayer1Cards(), {
                                    abc: { type: 'HEART', number: '2', point: 2 },
                                })
                            };
                            expect($push.rounds).to.eql(lastRoundData);
                        });
                });
                it('Hitting', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameHittingData());
                    const updateByIdStub = sinon.stub(mongodb, 'updateById').resolves(null);
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'SPADE', number: 'A' } })
                        .expect(200)
                        .then(() => {
                            const { $set, $push } = updateByIdStub.args[0][2];
                            expect($set.currentRoundPlayerCards).to.eql({});
                            expect($set.updatedBy).to.eql({ _id: 'abc' });
                            expect($set.updatedAt).to.be.an('date');
                            expect($set.playersCards['abc']).to.have.deep.not.include({ type: 'SPADE', number: 'A' });
                            const data = AssTestData.getStartedGameHittingData();
                            expect($set.currentPlayer).to.eql(data.playersInGame[0]);
                            const lastRoundData = {
                                type: 'HIT',
                                playerGotHit: data.playersInGame[0],
                                hitBy: { _id: 'abc' },
                                playersCards: _.assign({}, data.currentRoundPlayerCards, {
                                    abc: { type: 'SPADE', number: 'A', point: 14 },
                                }),
                                donePlayers: []
                            };
                            expect($push.rounds).to.eql(lastRoundData);
                        });
                });
                it('Mongodb error', () => {
                    sinon.stub(mongodb, 'findById').resolves(AssTestData.getStartedGameData());
                    const updateByIdSpy = sinon.spy(mongodb, 'updateById');
                    return app.post(basepath + '/123456789012/submit')
                        .set('x-player-token', jwt.sign({ _id: 'abc' }))
                        .send({ chosenCard: { type: 'HEART', number: '2' } })
                        .expect(500, responses.SERVER_ERROR)
                        .then(() => {
                            expect(updateByIdSpy.calledOnce).equal(true);
                            expect(updateByIdSpy).to.throws("Cannot read property 'updateOne' of undefined");
                        });
                });
            });
        });
    });
});