var assert = require('assert');

module.exports = {
    
    approxEqual: function (expected, actual) {
        assert(Math.abs(expected - actual) < 0.0000000000001);
    }

}