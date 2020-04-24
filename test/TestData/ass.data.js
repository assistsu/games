module.exports = Object.freeze({
    getCreatedGameData: () => {
        return {
            _id: '123456789012', status: 'CREATED', admin: { _id: '123' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
        }
    },
    getCreatedGameOnePlayerExistData: () => {
        return {
            _id: '123456789012', status: 'CREATED', admin: { _id: '123' },
            players: [{ _id: '123' }],
            playersInGame: [{ _id: '123' }],
        }
    },
    getCreatedGameInvalidFieldsData: () => {
        return {
            _id: '123456789012', status: 'CREATED', admin: { _id: '123' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
        }
    },
    getStartedGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
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
            _id: '123456789012a', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }, { _id: 'xyz' }],
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
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 14 }
                ],
                123: [{ type: 'HEART', number: 3 },]
            },
            currentRoundPlayerCards: { 123: { type: 'HEART', number: 3 } },
            assPlayers: {},
        }
    },
    getStartedGameRoundsGameEndData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                ],
                123: [{ type: 'HEART', number: 4 },]
            },
            currentRoundPlayerCards: { 123: { type: 'HEART', number: 3 } },
            assPlayers: {},
        }
    },
    getStartedGameHittingData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
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
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
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
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' }, currentPlayer: { _id: 'abc' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersInGame: [{ _id: '123' }, { _id: 'abc' }],
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
            _id: '123456789012', status: 'ENDED',
            players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
            playersInGame: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
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