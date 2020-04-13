const request = require('supertest');
const sinon = require('sinon');

const app = request(require('../app'));

describe('App apis tests', function () {
    it('getting index.html', () => {
        return app.get('/index.html').expect(200);
    });
});