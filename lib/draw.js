var request = require('request'),
    Promise = require('promise'),
    async = require('async'),
    proj4 = require('proj4'),
    PngQuant = require('pngquant'),
    im = require('imagemagick'),    
    fs = require('fs'),
    
    config = require('../config'),
    mercator = require('./mercator'),
    s3 = require('./s3')

module.exports = function (layer, zoom, x, y, type) {
    
    var options = config.layers[layer],
        metaTileSize = options.metaTileSize || 3,
        srs = options.srs || 'EPSG:4326',
        scale = options.scale || 1,
        tmpDir = config.tmpDir || '/tmp';

    var width = mercator.tileSize * metaTileSize * scale,
        height = width;

    var minx = Math.floor(x / metaTileSize) * metaTileSize,
        miny = Math.floor(y / metaTileSize) * metaTileSize,
        maxx = minx + metaTileSize - 1,
        maxy = miny + metaTileSize - 1;

    var minBounds = mercator.tileLatLonBounds(minx, miny, zoom),
        maxBounds = mercator.tileLatLonBounds(maxx, maxy, zoom),
        bounds = [minBounds.min.lon, minBounds.min.lat, maxBounds.max.lon, maxBounds.max.lat];

    if (srs !== 'EPSG:4326') {
        var min = proj4('EPSG:4326', srs, [bounds[0], bounds[1]]),
            max = proj4('EPSG:4326', srs, [bounds[2], bounds[3]]);
        bounds = [min[0], min[1], max[0], max[1]];
    }

    var filename = tmpDir + '/' + layer + '-' + zoom + '-' + minx + '-' + miny + '.' + type;

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
        params.push('bbox=' + bounds.join(','));
        params.push('transparent=' + (options.transparent !== false));
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
            console.log("drawing " + buildUrl());
            request(buildUrl())
                .pipe(fs.createWriteStream(filename))
                .on('close', resolve)
                .on('error', reject);
        });
    }

    function crop() {
        return new Promise(function (resolve, reject) {
            var size = mercator.tileSize * scale;
            im.convert([filename, '-crop', size + 'x' + size, filename + '.%d'], function (err) {
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
                    ty = miny + metaTileSize - 1 - Math.floor(num / metaTileSize),
                    key = '/' + layer + '/' + zoom + '/' + tx + '/' + ty + '.' + type;

                var bufs = [];
                fs.createReadStream(filename + '.' + num)
                    .pipe(new PngQuant())
                    .on('data', function (data) {
                        bufs.push(data);
                    })
                    .on('end', function () {
                        var data = Buffer.concat(bufs);
                        var req = s3.put(key, {
                            'Content-Length': data.length,
                            'Content-Type': 'image/' + type
                        });
                        req.on('response', function(res){
                            if (200 == res.statusCode) {
                                done();
                            }
                        }).on('error', function (err) {
                            done(err);
                        })
                        req.end(data);
                    })
                    .on('error', function (err) {
                        done(err);
                    });
            };
        });
        return new Promise(function (resolve, reject) {
            async.parallel(fn, function (err) {
                if (err) {
                    reject(err);
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