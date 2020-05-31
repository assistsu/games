const request = require('supertest');

const jwt = require('../utils/jwt');
const { responses } = require('../utils/ResponseUtil');

describe("[Player Authentication]", () => {
    const app = request(require('../app'));
    ['uno', 'ass', 'leastcount'].forEach(game => describe("Game : " + game, () => {
        const basepath = '/api/v1/' + game;
        it("Without player token", () => {
            return app.post(basepath + '/id')
                .expect(401, responses.INVALID_PLAYER_TOKEN);
        });
        it("Invalid player token", () => {
            return app.post(basepath + '/id')
                .set('x-player-token', 'dummy')
                .expect(401, responses.INVALID_PLAYER_TOKEN);
        });
        it("Valid player token", () => {
            return app.post(basepath + '/id')
                .set('x-player-token', jwt.sign({ _id: '123' }))
                .expect(400, responses.INVALID_ROOM_ID);
        });
    }));
});