const commonFields = ['_id', 'roomName', 'status', 'admin', 'currentPlayer', 'players', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'messages'];

module.exports = {
    gameFieldsMap: {
        uno: [...commonFields, 'myCards', 'lastCard',],
        ass: [...commonFields, 'myCards', 'playersInGame', 'currentRoundPlayerCards',],
        leastcount: [...commonFields, 'myCards', 'currentPlayerAction', 'lastCards', 'myPoints', 'currentPlayerDroppedCards', 'playersTotalPoints', 'rounds',],
        ludo: [...commonFields, 'myTokens',],
    }
};