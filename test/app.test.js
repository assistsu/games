const request = require('supertest');
const app = request(require('../app'));

describe('App apis tests', function () {
    
    it('getting home page', () => {
        return app.get('/').expect(200);
    });

    it('invalid path', () => {
        return app.get('/index.html').expect(404);
    });

    it('getting uno game', () => {
        return app.get('/game/uno/id').expect(200);
    });

    it('getting ass game', () => {
        return app.get('/game/ass/id').expect(200);
    });

    it('getting leastcount game', () => {
        return app.get('/game/leastcount/id').expect(200);
    });
});