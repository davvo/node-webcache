var assert = require('assert'),
    util = require('./util'),
    mercator = require('../lib/mercator.js');

it('should convert latlon to meters', function () {
    var meters = mercator.latLonToMeters(66.51326044311188, 90);
    util.approxEqual(10018754.171394622, meters.x);
    util.approxEqual(10018754.171394626, meters.y);
});

it('should convert meters to latlon', function () {
    var latlon = mercator.metersToLatLon(10018754.171394622, 10018754.171394626);
    util.approxEqual(66.51326044311188, latlon.lat);
    util.approxEqual(90, latlon.lon);
});

it('should convert pixels to meters', function () {
    var meters = mercator.pixelsToMeters(768, 512, 2);
    util.approxEqual(10018754.17139462, meters.x);
    util.approxEqual(0, meters.y);
});

it('should convert meters to pixels', function () {
    var pixels = mercator.metersToPixels(10018754.17139462, 0, 2);
    assert.equal(768, pixels.x);
    assert.equal(512, pixels.y);
});

it('should convert pixels to tile', function () {
    var tile = mercator.pixelsToTile(800, 550, 2);
    assert.equal(3, tile.x);
    assert.equal(2, tile.y);
});

it('should convert meters to tile', function () {
    var tile = mercator.metersToTile(10018754.17139462, 0, 2);
    assert.equal(3, tile.x);
    assert.equal(2, tile.y);
});

it('should return mercator tile bounds', function () {
    var bounds = mercator.tileBounds(3, 2, 2);
    util.approxEqual(10018754.17139462, bounds.min.x);
    util.approxEqual(0, bounds.min.y);
    util.approxEqual(20037508.342789244, bounds.max.x);
    util.approxEqual(10018754.17139462, bounds.max.y);
});

it('should return latlon tile bounds', function () {
    var bounds = mercator.tileLatLonBounds(3, 2, 2);
    util.approxEqual(0, bounds.min.lat);
    util.approxEqual(90, bounds.min.lon);
    util.approxEqual(66.51326044311188, bounds.max.lat);
    util.approxEqual(180, bounds.max.lon);
});
