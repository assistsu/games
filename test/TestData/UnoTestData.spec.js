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
        id: '123456789012',
        status: 'STARTED',
        players: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
        playersInGame: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
        admin: { _id: '123' },
        currentPlayer: { _id: 'abc' },
        lastCard: { color: 'primary', type: '2' },
        inc: 1,
        playersCards: {
            abc: [
                { color: 'dark', type: 'WILD_CARD' },
                { color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS' },
                { color: 'primary', type: 'DRAW_TWO_CARDS' },
                { color: 'primary', type: 'REVERSE_CARD' },
                { color: 'primary', type: 'SKIP_CARD' },
                { color: 'success', type: '1' },
                { color: 'success', type: '2' },
                { color: 'primary', type: '1' },
            ],
            123: [],
            xyz: [],
        },
        deck: [
            { color: 'primary', type: '3' },
            { color: 'primary', type: '4' },
            { color: 'primary', type: '5' },
            { color: 'primary', type: '6' },
        ],
    })

    static getStartedGameCurrPlayerXYZData = () => _.assign(
        this.getStartedGameData(),
        { currentPlayer: { _id: 'xyz' } },
    )

    static getStartedGame2PlayerData = () => _.assign(
        this.getStartedGameData(),
        { players: [{ _id: '123' }, { _id: 'abc' }] },
    )

    static getStartedGameWithLastCardWildCardData = () => _.assign(
        this.getStartedGameData(),
        { lastCard: { color: 'dark', type: 'WILD_CARD', chosenColor: 'primary' }, }
    )

    static getStartedGameMyLastCardData = () => _.mergeWith(
        this.getStartedGameData(),
        {
            playersCards: {
                abc: [{ color: 'primary', type: '1' },],
            }
        },
        LodashUtil.replaceArrayOnMerge
    )

    static getStartedGameMyLastBeforeCardData = () => _.mergeWith(
        this.getStartedGameMyLastCardData(),
        {
            playersCards: {
                abc: [
                    { color: 'success', type: '1' },
                ],
            }
        },
        LodashUtil.concatArrayOnMerge
    )

    static getStartedGameWithPassData = () => _.merge(
        this.getStartedGameData(),
        { currentPlayer: { pass: true } }
    )
}