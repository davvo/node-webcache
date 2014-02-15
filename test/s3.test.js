var assert = require('assert'),
    knox = require('knox'),
    
    client = knox.createClient({
        key: process.env.AWS_ACCESS_KEY,
        secret: process.env.AWS_SECRET,
        bucket: process.env.AWS_BUCKET
    });

describe("Test s3 put and get", function () {

    this.timeout(5000);

    it('should put json', function (done) {
        var string = JSON.stringify({ foo: "bar" });
        var req = client.put('/test/obj.json', {
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
        var req = client.getFile('/test/obj.json', function(err, res) {
            if (err) {
                assert.fail();
            } else {
                assert.equal(200, res.statusCode);
                done();
            }
        });
    });

});
