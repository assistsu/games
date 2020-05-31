const _ = require('lodash');

const standardDeckCardTypes = ['SPADE', 'HEART', 'CLUB', 'DIAMOND'];

class GameUtil {

    static shuffle = require('shuffle-array');

    static setGameName(gameName) {
        return (req, res, next) => {
            req.gameName = gameName;
            next();
        }
    }

    static commonGameFields = [
        '_id',
        'roomName',
        'status',
        'players',
        'playersInGame',
        'admin',
        'currentPlayer',
        'createdBy',
        'createdAt',
        'updatedBy',
        'updatedAt',
        'messages',
    ];

    static gameFields = {
        uno: this.commonGameFields.concat(['lastCard',]),
        ass: this.commonGameFields.concat(['currentRoundPlayerCards',]),
        leastcount: this.commonGameFields.concat(['currentPlayerAction', 'currentPlayerDroppedCards', 'lastCards', 'playersTotalPoints', 'showResult',]),
    }

    static setMyCards(gameData, player, fields) {
        if (gameData.playersCards) {
            fields.myCards = gameData.playersCards[player._id] || [];
            fields.players = fields.players.map(o => _.assign({ cardsCount: (gameData.playersCards[o._id] || []).length }, o));
        }
    }

    static setMyPoints(gameData, player, fields) {
        if (gameData.playersPoints) {
            fields.myPoints = gameData.playersPoints[player._id] || 0;
        }
    }

    static omitPlayerGotHitCard(lastRound, player) {
        return (lastRound && lastRound.type == 'HIT') && (lastRound.playerGotHit._id != player._id || lastRound.hitBy._id != player._id);
    }

    static getLastRoundInfo(lastRound, player) {
        return _.omit(lastRound, this.omitPlayerGotHitCard(lastRound, player) ? [lastRound.playerGotHit._id] : []);
    }

    static pickGamePublicFields(gameName, gameData, player) {
        const fields = _.pick(gameData, this.gameFields[gameName]);
        switch (gameName) {
            case 'leastcount':
                this.setMyCards(gameData, player, fields);
                this.setMyPoints(gameData, player, fields);
                break;
            case 'ass':
                this.setMyCards(gameData, player, fields);
                _.assign(fields, { lastRound: this.getLastRoundInfo(_.nth(gameData.rounds, -1), player) });
                break;
        }
        return fields;
    }

    static getNextPlayer(players, currentPlayer, inc = 1) {
        const currentPlayerInd = _.findIndex(players, { _id: currentPlayer._id });
        const nextPlayerInd = (currentPlayerInd + inc) % players.length;
        const nextPlayer = players[nextPlayerInd >= 0 ? nextPlayerInd : players.length - 1];
        return nextPlayer;
    }

    static getStandardDeck(pointMapper, includeJoker = 0) {
        let cards = [];
        _.values(standardDeckCardTypes).forEach(o => {
            for (let i = 2; i <= 10; i++) {
                cards.push({ type: o, number: i.toString(), point: pointMapper(i) });
            }
            cards.push({ type: o, number: 'J', point: pointMapper('J') });
            cards.push({ type: o, number: 'Q', point: pointMapper('Q') });
            cards.push({ type: o, number: 'K', point: pointMapper('K') });
            cards.push({ type: o, number: 'A', point: pointMapper('A') });
        });
        Array(includeJoker).fill().forEach(o => {
            cards.push({ type: 'JOKER', number: 'JOKER', point: pointMapper('JOKER') });
        });
        return cards;
    }
}


module.exports = GameUtil;