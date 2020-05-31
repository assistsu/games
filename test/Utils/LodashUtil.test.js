const { expect } = require('chai');
const _ = require('lodash');
const LodashUtil = require('../../utils/LodashUtil');

describe('LodashUtil tests', function () {
    it('Lodash concat array on merge', function () {
        const actual = _.mergeWith({ a: [1, 2] }, { a: [3, 4] }, LodashUtil.concatArrayOnMerge);
        const expected = { a: [1, 2, 3, 4] };
        expect(expected).to.eql(actual);
    });

    it('Lodash replace array on merge', function () {
        const actual = _.mergeWith({ a: [1, 2] }, { a: [3, 4] }, LodashUtil.replaceArrayOnMerge);
        const expected = { a: [3, 4] };
        expect(expected).to.eql(actual);
    });
});