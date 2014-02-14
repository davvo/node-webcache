var assert = require('assert'),
    util = require('./util'),
    MetaTile = require('../lib/metatile');

it('should create a new meta tile', function () {
    var metaTile = new MetaTile(0, 0, 2);
    assert.equal(0, metaTile.x);
    assert.equal(0, metaTile.y);
    assert.equal(2, metaTile.z);
});

it('should return tile bounds', function () {
    var metaTile = new MetaTile(0, 0, 2),
        bounds = metaTile.tileBounds();
    util.approxEqual(-20037508.342789244, bounds.min.x);
    util.approxEqual(-20037508.342789244, bounds.min.y);
    util.approxEqual(10018754.17139462, bounds.max.x);
    util.approxEqual(10018754.17139462, bounds.max.y);
});

it('should return tile latlon bounds', function () {
    var metaTile = new MetaTile(0, 0, 2),
        bounds = metaTile.tileLatLonBounds();
    util.approxEqual(-85.05112877980659, bounds.min.lat);
    util.approxEqual(-180, bounds.min.lon);
    util.approxEqual(66.51326044311188, bounds.max.lat);
    util.approxEqual(90, bounds.max.lon);
});