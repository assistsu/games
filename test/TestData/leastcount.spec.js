module.exports = Object.freeze({
    getCreatedGameData: () => {
        return {
            _id: '123456789012', status: 'CREATED', admin: { _id: '123' },
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {},
        }
    },
    getCreatedGameOnePlayerExistData: () => {
        return {
            _id: '123456789012', status: 'CREATED', admin: { _id: '123' },
            players: [{ _id: '123' }],
            playersCards: {},
        }
    },
    getCreatedGameInvalidFieldsData: () => {
        return {
            _id: '123456789012', status: 'CREATED', admin: { _id: '123' },
            players: [{ _id: '123' }, { _id: 'abc' }],
        }
    },
    getStartedSubmitActionGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            currentPlayerAction: 'SUBMIT',
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 2 },
                    { type: 'SPADE', number: 13 }
                ],
                123: [
                    { type: 'HEART', number: 3 },
                ]
            },
            playersPoints: {
                abc: 15,
                123: 3,
            }
        }
    },
    getStartedTakeActionGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            currentPlayerAction: 'TAKE',
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 2 },
                    { type: 'SPADE', number: 13 }
                ],
                123: [
                    { type: 'HEART', number: 3 },
                ]
            },
            playersPoints: {
                abc: 15,
                123: 3,
            },
            deck: [
                { type: 'HEART', number: 6 },
            ],
            lastCards: [
                { type: 'HEART', number: 7 },
            ],
            currentPlayerDroppedCards: []
        }
    },
    getStartedDecideActionGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            currentPlayerAction: 'DECIDE',
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 2 },
                    { type: 'SPADE', number: 2 },
                    { type: 'SPADE', number: 13 }
                ],
                123: [
                    { type: 'HEART', number: 3 },
                ]
            },
            playersPoints: {
                abc: 15,
                123: 3,
            },
            deck: [
                { type: 'HEART', number: 6 },
            ],
            lastCards: [
                { type: 'HEART', number: 7 },
            ],
        }
    },
    getStartedDecideActionGoodShowGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            currentPlayerAction: 'DECIDE',
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 1 },
                ],
                123: [
                    { type: 'HEART', number: 3 },
                ]
            },
            playersPoints: {
                abc: 1,
                123: 3,
            }
        }
    },
    getStartedDecideActionGoodShowNotFirstGameData: () => {
        return {
            _id: '123456789012', status: 'STARTED', admin: { _id: '123' },
            currentPlayer: { _id: 'abc' },
            currentPlayerAction: 'DECIDE',
            players: [{ _id: '123' }, { _id: 'abc' }],
            playersCards: {
                abc: [
                    { type: 'HEART', number: 1 },
                ],
                123: [
                    { type: 'HEART', number: 3 },
                ]
            },
            playersPoints: {
                abc: 1,
                123: 3,
            },
            playersTotalPoints: {
                abc: 1,
                123: 3,
            }
        }
    },
    getEndedGameData: () => {
        return {
            _id: '123456789012', status: 'ENDED',
            players: [{ _id: '123' }, { _id: 'abc' }], admin: { _id: '123' },
        }
    }
});