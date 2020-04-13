module.exports = {
    CREATED_GAME: {
        id: '123456789012', status: 'CREATED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' }
    },
    STARTED_GAME: {
        id: '123456789012', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
        currentPlayer: { _id: 'abc' }, playersCards: {}
    },
    ENDED_GAME: {
        id: '123456789012', status: 'ENDED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' }
    },
    CREATED_GAME_FILLED: {
        id: '123456789012', status: 'CREATED',
        players: [
            { _id: '123' }, { _id: 'abc' },
            { _id: '123' }, { _id: 'abc' },
            { _id: '123' }, { _id: 'abc' },
            { _id: '123' }, { _id: 'abc' },
            { _id: '123' }, { _id: 'abc' }
        ],
        admin: { _id: '123' }
    }
}