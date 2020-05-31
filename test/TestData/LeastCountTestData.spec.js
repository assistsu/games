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
                { type: 'HEART', number: 2 },
                { type: 'SPADE', number: 2 },
                { type: 'SPADE', number: 13 }
            ],
            123: [
                { type: 'HEART', number: 3 },
            ],
            xyz: [
                { type: 'HEART', number: 1 },
            ]
        },
        playersPoints: {
            abc: 17,
            123: 3,
            xyz: 1,
        },
        playersTotalPoints: {},
        deck: [
            { type: 'HEART', number: 6 },
        ],
        lastCards: [
            { type: 'HEART', number: 7 },
        ],
    })

    static getStartedGameCurrPlayerXYZData = () => _.assign(
        this.getStartedGameData(),
        { currentPlayer: { _id: 'xyz' } },
    )

    static getStartedGame2PlayerData = () => _.assign(
        this.getStartedGameData(),
        {
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersPoints: {
                abc: 1,
                123: 3,
            }
        },
    )

    static getStartedDecideActionGameData = () => _.assign(
        this.getStartedGameData(),
        { currentPlayerAction: 'DECIDE' }
    )

    static getStartedDecideActionSecondRoundGameData = () => _.assign(
        this.getStartedDecideActionGameData(),
        {
            playersTotalPoints: {
                abc: 70,
                123: 3,
                xyz: 1,
            }
        }
    )

    static getStartedSubmitActionGameData = () => _.assign(
        this.getStartedGameData(),
        { currentPlayerAction: 'SUBMIT' }
    )

    static getPlayerShowedGameData = () => _.assign(
        this.getStartedGameData(),
        { status: 'PLAYER_SHOWED' }
    )

    static getPlayerShowed1PlayerGameData = () => _.assign(
        this.getCreatedGameData(),
        { status: 'PLAYER_SHOWED' }
    )

    static getStartedTakeActionGameData = () => _.assign(
        this.getStartedGameData(),
        {
            currentPlayerAction: 'TAKE',
            currentPlayerDroppedCards: []
        }
    )

    static getStartedDecideActionGoodShowGameData = () => _.assign(
        this.getStartedGameData(),
        {
            currentPlayerAction: 'DECIDE',
            playersCards: {
                abc: [
                    { type: 'HEART', number: 1 },
                ],
                123: [
                    { type: 'HEART', number: 3 },
                ],
                xyz: [
                    { type: 'HEART', number: 4 },
                ]
            },
            playersPoints: {
                abc: 1,
                123: 3,
                xyz: 4,
            }
        }
    )
};