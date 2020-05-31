const _ = require('lodash');

class LodashUtil {
    static concatArrayOnMerge(objValue, srcValue) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }
    static replaceArrayOnMerge(objValue, srcValue) {
        if (_.isArray(srcValue)) {
            return srcValue;
        }
    }
}

module.exports = LodashUtil;