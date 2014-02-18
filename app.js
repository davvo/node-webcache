var express = require('express'),
    s3 = require('./lib/s3'),
    draw = require('./lib/draw'),
    config = require('./config'),

    app = express(),
    drawing = {};

if (process.env.NODE_ENV !== 'production') {
    require('longjohn');
}

function getExpires(response, options) {
    var lastModified = new Date(response.headers['last-modified']);
    var maxAge = options.maxAge || 3600;
    return new Date(lastModified.getTime() + maxAge * 1000);
}

function getMetaTile(layer, zoom, tileX, tileY, options) {
    var metaTileSize = options.metaTileSize || 3,
        metaX = Math.floor(tileX / metaTileSize) * metaTileSize,
        metaY = Math.floor(tileY / metaTileSize) * metaTileSize;
    return layer + '-' + zoom + '-' + metaX + '-' + metaY;
}

function tryS3(req, res) {
    var layer = req.params.layer,
        type = req.params.type,
        x = parseInt(req.params.x, 10),
        y = parseInt(req.params.y, 10),
        z = parseInt(req.params.z, 10);

    var options = config.layers[layer];
    if (!options) {
        return res.send(404, req.path);
    }

    var metaTile = getMetaTile(layer, z, x, y, options);

    s3.get(req.path).on('response', function (response) {
        var now = new Date(),
            expires = getExpires(response, options);
        if (response.statusCode === 200 && (expires > now)) {
            res.set({
                'Cache-Control': 'public, max-age=' + Math.floor((expires - now) / 1000)
            });
            response.pipe(res);
        } else {
            if (!drawing[metaTile]) {
                drawing[metaTile] = draw(layer, z, x, y, type).then(function () {
                    delete(drawing[metaTile]);
                });
            }
            drawing[metaTile].done(function () {
                tryS3(req, res);
            }, function (err) {
                res.send(500, err);
            });
        }
    }).on('error', function (err) {
        console.error("Error in try s3", err);
        res.send(500, err);
    }).end();
}

app.get('/:layer/:z/:x/:y.:type', tryS3);

var port = process.env.PORT || 5000;
app.listen(port);
console.log('Server listening on port ' + port);