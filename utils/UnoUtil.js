const _ = require('lodash');

class UnoUtil {
    static card_types = {
        DRAW_TWO_CARDS: 'DRAW_TWO_CARDS',
        REVERSE_CARD: 'REVERSE_CARD',
        SKIP_CARD: 'SKIP_CARD',
        WILD_CARD: 'WILD_CARD',
        WILD_CARD_DRAW_FOUR_CARDS: 'WILD_CARD_DRAW_FOUR_CARDS'
    };
    static card_colours = [
        'warning', 'danger', 'success', 'primary',
    ]
    static getCards() {
        let cards = [];
        this.card_colours.forEach(o => {
            for (let i = 1; i < 20; i++) {
                cards.push({ color: o, type: `${i % 10}` });
            }
            [1, 2].forEach(_ => ['DRAW_TWO_CARDS', 'REVERSE_CARD', 'SKIP_CARD'].map(oo => cards.push({ color: o, type: oo })));
            cards.push({ color: 'dark', type: 'WILD_CARD' });
            cards.push({ color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS' });
        });
        return cards;
    }

    static isActionValid(lastCard, chosenCard) {
        return chosenCard.color == 'dark' ||
            lastCard.color == chosenCard.color ||
            lastCard.type == chosenCard.type ||
            (lastCard.color == 'dark' && lastCard.chosenColor == chosenCard.color);
    }
}

module.exports = UnoUtil;