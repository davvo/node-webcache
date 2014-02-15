var request = require('request'),
    Promise = require('promise'),
    async = require('async'),
    im = require('imagemagick'),    
    fs = require('fs'),
    
    config = require('../config'),
    mercator = require('./mercator'),
    s3 = require('./s3')

module.exports = function (layer, zoom, x, y, type) {
    
    var options = config.layers[layer],
        metaTileSize = options.metaTileSize || 3;

    var width = mercator.tileSize * metaTileSize,
        height = width;

    var minx = Math.floor(x / metaTileSize) * metaTileSize,
        miny = Math.floor(y / metaTileSize) * metaTileSize,
        maxx = minx + metaTileSize - 1,
        maxy = miny + metaTileSize - 1;

    console.log(zoom, x, y);
    console.log(minx, miny, width, height);

    var minBounds = mercator.tileLatLonBounds(minx, miny, zoom),
        maxBounds = mercator.tileLatLonBounds(maxx, maxy, zoom);

    var filename = layer + '-' + zoom + '-' + minx + '-' + miny + '.' + type;

    function buildUrl() {
        var params = [];
        params.push('service=WMS');
        params.push('version=1.1.0');
        params.push('request=GetMap');
        params.push('format=image/' + type);
        params.push('srs=' + options.srs);
        params.push('layers=' + layer);
        params.push('width=' + width);
        params.push('height=' + height);
        params.push('bbox=' + [minBounds.min.lon, minBounds.min.lat, maxBounds.max.lon, maxBounds.max.lat].join(','));
        return options.url + '?' + params.join('&');
    }

    function tileArray() {
        var arr = [], 
            numTiles = Math.pow(metaTileSize, 2);
        for (var i = 0; i < numTiles; ++i) {
            arr.push(i);
        }
        return arr;
    }

    function draw() {
        return new Promise(function (resolve, reject) {
            console.log("draw...", buildUrl());
            request(buildUrl())
                .pipe(fs.createWriteStream(filename))
                .on('close', resolve)
                .on('error', reject);
        });
    }

    function crop() {
        return new Promise(function (resolve, reject) {
            console.log("crop...");
            im.convert([filename, '-crop', mercator.tileSize + 'x' + mercator.tileSize, filename + '.%d'], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    function storeInS3() {
        var fn = tileArray().map(function (num) {
            return function (done) {
                var tx = minx + num % metaTileSize,
                    ty = miny + Math.floor(num / metaTileSize),
                    key = '/' + layer + '/' + zoom + '/' + tx + '/' + ty + '.' + type;
                s3.putFile(filename + '.' + num, key, done);
            };
        });
        return new Promise(function (resolve, reject) {
            console.log("store in s3...");
            async.parallel(fn, function (err) {
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    function cleanUp() {
        var fn = tileArray().map(function (num) {
            return function (cb) {
                fs.unlink(filename + '.' + num, cb);
            }
        });
        fn.push(function (cb) {
            fs.unlink(filename, cb);
        });
        return new Promise(function (resolve, reject) {
            console.log("cleanup...");
            async.parallel(fn, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    return draw().then(crop).then(storeInS3).then(cleanUp);

}