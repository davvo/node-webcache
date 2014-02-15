var express = require('express'),
    s3 = require('./lib/s3'),
    draw = require('./lib/draw'),

    app = express(),
    drawer = {};

function tryS3(req, res) {
    var layer = req.params.layer,
        type = req.params.type,
        x = parseInt(req.params.x, 10),
        y = parseInt(req.params.y, 10),
        z = parseInt(req.params.z, 10);

    s3.get(req.path).on('response', function (response) {
        if (response.statusCode === 200) {
            response.pipe(res);
        } else {
            if (!drawer[req.path]) {
                drawer[req.path] = draw(layer, z, x, y, type).then(function () {
                    delete(drawer[req.path]);
                });
            }
            drawer[req.path].done(function () {
                tryS3(req, res);
            }, function (err) {
                res.send(500, err);
            });
        }
    }).end();
}

app.get('/:layer/:z/:x/:y.:type', tryS3);

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Server listening on port ' + port);