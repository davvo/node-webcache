var assert = require('assert'),
    s3 = require('../lib/s3');
    
describe("Test s3 put and get", function () {

    this.timeout(5000);

    it('should put json', function (done) {
        var string = JSON.stringify({ foo: "bar" });
        var req = s3.put('/test/obj.json', {
            'Content-Length': string.length,
            'Content-Type': 'application/json'
        });
        req.on('response', function(res){
            assert.equal(200, res.statusCode);
            done();
        });
        req.end(string);
    });

    it('should get json', function (done) {
        var req = s3.getFile('/test/obj.json', function(err, res) {
            if (err) {
                assert.fail();
            } else {
                assert.equal(200, res.statusCode);
                done();
            }
        });
    });

});
