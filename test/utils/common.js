const expect = require('chai').expect;
const common = require('../../utils/common');

describe('Common utils unit tests', function () {
    it('match random should be less than or equal to max value', done => {
        expect(common.randomNumber(0, 57)).to.lessThan(58);
        done();
    });
    it('match random should be greater than or equal to min value', done => {
        expect(common.randomNumber(0, 57)).to.greaterThan(-1);
        done();
    });
})