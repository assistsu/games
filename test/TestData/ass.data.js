module.exports = Object.freeze({
    getCreatedGameData: () => {
        return {
            _id: '123456789012', status: 'CREATED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' }
        }
    },
    getCreatedGameOnePlayerExistData: () => {
        return {
            _id: '123456789012', status: 'CREATED', players: [{ _id: '123' }], admin: { _id: '123' }
        }
    },
    getCreatedGameInvalidFieldsData: () => {
        return {
            _id: '123456789012', status: 'CREATED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' }
        }
    },
    getStartedGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 14 }
                ]
            },
            currentRoundPlayerCards: {},
            assPlayers: {},
        }
    },
    getStartedGameRoundsNotFirstLastCardData: () => {
        return {
            _id: '123456789012a', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
            admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 14 }
                ],
            },
            currentRoundPlayerCards: { 123: { type: 'HEART', number: 3 } },
            assPlayers: {},
        }
    },
    getStartedGameRoundsLastCardData: () => {
        return {
            _id: '123456789012', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }],
            admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 14 }
                ],
            },
            currentRoundPlayerCards: { 123: { type: 'HEART', number: 3 } },
            assPlayers: {},
        }
    },
    getStartedGameHittingData: () => {
        return {
            _id: '123456789012', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }],
            admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            playersCards: {
                123: [],
                abc: [{ type: 'HEART', number: 2 }, { type: 'SPADE', number: 14 }],
            },
            currentRoundPlayerCards: { 123: { type: 'CLUB', number: 3 } },
            assPlayers: {},
        }
    },
    getStartedGamePlayerLastCardData: () => {
        return {
            _id: '123456789012', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }],
            admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            playersCards: {
                123: [],
                abc: [{ type: 'HEART', number: 2 }],
            },
            currentRoundPlayerCards: { 123: { type: 'HEART', number: 3 } },
            assPlayers: {},
        }
    },
    getStartedGamePlayerLastCardAssInLastGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', players: [{ _id: '123' }, { _id: 'abc' }],
            admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            playersCards: {
                123: [],
                abc: [{ type: 'HEART', number: 2 }],
            },
            currentRoundPlayerCards: { 123: { type: 'HEART', number: 3 } },
            assPlayers: { abc: 1 },
        }
    },
    getEndedGameData: () => {
        return {
            _id: '123456789012', status: 'ENDED', players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' }
        }
    },
    getCreatedGameRoomFullData: () => {
        return {
            _id: '123456789012', status: 'CREATED',
            players: [
                { _id: '123' }, { _id: 'abc' },
                { _id: '123' }, { _id: 'abc' },
                { _id: '123' }, { _id: 'abc' },
                { _id: '123' }, { _id: 'abc' },
                { _id: '123' }, { _id: 'abc' },
                { _id: '123' }, { _id: 'abc' },
                { _id: '123' },
            ],
            admin: { _id: '123' }
        }
    }
});