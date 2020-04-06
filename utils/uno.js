const card_types = {
    DRAW_TWO_CARDS: 'DRAW_TWO_CARDS',
    REVERSE_CARD: 'REVERSE_CARD',
    SKIP_CARD: 'SKIP_CARD',
    WILD_CARD: 'WILD_CARD',
    WILD_CARD_DRAW_FOUR_CARDS: 'WILD_CARD_DRAW_FOUR_CARDS'
}

const card_colours = {
    YELLOW: 'warning', RED: 'danger', GREEN: 'success', BLUE: 'primary',
}

exports.card_types = card_types;

exports.getCards = function () {
    let cards = [];
    Object.values(card_colours).forEach(o => {
        for (let i = 1; i < 20; i++) {
            cards.push({ color: o, type: `${i % 10}` });
        }
        [1, 2].forEach(_ => ['DRAW_TWO_CARDS', 'REVERSE_CARD', 'SKIP_CARD'].map(oo => cards.push({ color: o, type: oo })));
        cards.push({ color: 'dark', type: 'WILD_CARD' });
        cards.push({ color: 'dark', type: 'WILD_CARD_DRAW_FOUR_CARDS' });
    });
    return cards;
}