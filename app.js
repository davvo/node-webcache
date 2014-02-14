var express = require('express'),
    Layer = require('./lib/layer'),
    MetaTile = require('./lib/metatile'),
    config = require('./config.json');

var layers = {};

Object.keys(config.layers).forEach(function (name) {
    layers[name] = new Layer(name, config.layers[name]);
});

var app = express();

app.get('/:layer/:z/:x/:y.:type', function (req, res) {
    var x = parseInt(req.params.x, 10),
        y = parseInt(req.params.y, 10),
        z = parseInt(req.params.z, 10);

    var layer = layers[req.params.layer];

    var metaTile = layer.metaTile(x, y, z);
    var url = layer.buildUrl(metaTile);
    console.log(url);

    res.send(metaTile.tileLatLonBounds());
});

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Server listening on port ' + port);