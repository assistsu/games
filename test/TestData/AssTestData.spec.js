const _ = require('lodash'),
    LodashUtil = require('../../utils/LodashUtil');

module.exports = class {

    static getCreatedGameData = () => ({
        _id: '123456789012',
        status: 'CREATED',
        admin: { _id: '123' },
        players: [{ _id: '123' }],
        minPlayers: 2,
    })

    static getCreatedGame2PlayersData = () => _.mergeWith(
        this.getCreatedGameData(),
        { players: [{ _id: 'abc' }] },
        LodashUtil.concatArrayOnMerge,
    )

    static getStartedGameData = () => ({
        _id: '123456789012',
        status: 'STARTED',
        admin: { _id: '123' },
        currentPlayer: { _id: 'abc' },
        players: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
        playersInGame: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
        playersCards: {
            abc: [
                {
                    type: 'HEART',
                    number: '2'
                },
                {
                    type: 'SPADE',
                    number: 'A'
                }
            ],
            123: [
                {
                    type: 'CLUB',
                    number: '2'
                },
            ],
            xyz: [
                {
                    type: 'DIAMOND',
                    number: '2'
                },
            ],
        },
        currentRoundPlayerCards: {},
        rounds: [],
        assPlayers: {},
    })

    static getStartedGameCurrentPlayerXYZData = () => _.assign(
        this.getStartedGameData(),
        { currentPlayer: { _id: 'xyz' } },
    )

    static getCurrentRoundPlayer1Cards = () => ({
        123: { type: 'HEART', number: '1', point: 1 },
    })

    static getStartedGameRoundsSecondCardData = () => _.assign(
        this.getStartedGameData(),
        { currentRoundPlayerCards: this.getCurrentRoundPlayer1Cards() },
    )

    static getCurrentRoundPlayer2Cards = () => ({
        123: { type: 'HEART', number: '1', point: 1 },
        xyz: { type: 'HEART', number: '3', point: 3 },
    })

    static getStartedGameMyLastCardData = () => _.mergeWith(
        this.getStartedGameData(),
        {
            currentRoundPlayerCards: this.getCurrentRoundPlayer2Cards(),
            playersCards: {
                abc: [{
                    type: 'HEART',
                    number: '2'
                }],
            }
        },
        LodashUtil.replaceArrayOnMerge
    )

    static getStartedGameLastCardData = () => _.mergeWith(
        this.getStartedGameData(),
        {
            currentRoundPlayerCards: this.getCurrentRoundPlayer1Cards(),
            playersCards: {
                abc: [{
                    type: 'HEART',
                    number: '2'
                }],
            },
            playersInGame: [{ _id: '123' }, { _id: 'abc' }]
        },
        LodashUtil.replaceArrayOnMerge
    )

    static getStartedGameRoundLastCardData = () => _.assign(
        this.getStartedGameData(),
        {
            currentRoundPlayerCards: this.getCurrentRoundPlayer2Cards(),
        },
    )

    static getStartedGameHittingData = () => _.assign(
        this.getStartedGameData(),
        {
            currentRoundPlayerCards: {
                123: { type: 'CLUB', number: '1', point: 1 },
            },
        }
    )

    static getStartedGameOnlyRoundExist3PlayerHitData = () => _.assign(
        this.getStartedGameData(),
        {
            rounds: [{
                type: 'HIT',
                hitBy: { _id: 'xyz' },
                playerGotHit: { _id: '123' },
                playersCards: {
                    abc: {
                        type: 'SPADE',
                        number: '9',
                        point: 9,
                    },
                    123: {
                        type: 'SPADE',
                        number: '10',
                        point: 10
                    },
                    xyz: {
                        type: 'CLUB',
                        number: '10',
                        point: 10
                    },

                }
            }]
        }
    )

    static getStartedGameOnlyRoundExist2PlayerHitData = () => _.assign(
        this.getStartedGameData(),
        {
            rounds: [{
                type: 'HIT',
                hitBy: { _id: 'xyz' },
                playerGotHit: { _id: 'abc' },
                playersCards: {
                    abc: {
                        type: 'SPADE',
                        number: '9',
                        point: 9,
                    },
                    xyz: {
                        type: 'CLUB',
                        number: '10',
                        point: 10
                    },

                }
            }]
        }
    )

    static getStartedGameLastRoundAllSubmittedData = () => _.assign(
        this.getStartedGameData(),
        {
            rounds: [{
                type: 'ALL_SUBMITTED',
                playersCards: {
                    abc: {
                        type: 'HEART',
                        number: '10',
                        point: 10,
                    },
                    123: {
                        type: 'HEART',
                        number: '9',
                        point: 9
                    },
                    xyz: {
                        type: 'HEART',
                        number: '8',
                        point: 8
                    },
                }
            }]
        }
    )

};