module.exports = {
    getCreatedGameData: () => Object({
        _id: '123456789012',
        status: 'CREATED',
        admin: { _id: '123' },
        players: [{ _id: '123' }, { _id: 'abc' }],
    }),
    getCreatedGameOnePlayerExistData: () => Object({
        _id: '123456789012',
        status: 'CREATED',
        admin: { _id: '123' },
        players: [{ _id: '123' }],
    }),
    getStartedGameData: () => Object({
        _id: '123456789012',
        status: 'STARTED',
        admin: { _id: '123' },
        players: [{ _id: '123' }, { _id: 'abc' }],
        playersInGame: [{ _id: '123' }, { _id: 'abc' }],
        playersCards: {
            abc: [
                { type: 'HEART', number: '2' },
                { type: 'SPADE', number: 'A' }
            ]
        },
        currentPlayer: { _id: 'abc' },
        currentRoundPlayerCards: {},
        assPlayers: {},
    }),
    getEndedGameData: () => Object({
        _id: '123456789012', status: 'ENDED',
        players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
        playersInGame: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
    }),
    getCreatedGameRoomFullData: () => Object({
        _id: '123456789012', status: 'CREATED',
        players: [
            { _id: '123' },
        ],
        admin: { _id: '123' },
        maxPlayers: 1,
    }),
};