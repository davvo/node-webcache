var express = require('express'),
    MetaTile = require('./lib/metatile.js'),
    config = require('./config.json');

var app = express();

function buildUrl(layer, metaTile) {
    var params = [];
    params.push('service=WMS');
    params.push('version=1.1.0');
    params.push('request=GetMap');
    params.push('format=' + layer.format);
    params.push('srs=' + layer.srs);
    params.push('layers=' + layer.name);
    params.push('width=' + metaTile.width);
    params.push('height=' + metaTile.height);

    var bounds = metaTile.tileLatLonBounds();
    params.push('bbox=' + [bounds.min.lon, bounds.min.lat, bounds.max.lon, bounds.max.lat].join(','));

    return layer.url + '?' + params.join('&');
};

app.get('/:layer/:z/:x/:y.:type', function (req, res) {
    var x = parseInt(req.params.x, 10),
        y = parseInt(req.params.y, 10),
        z = parseInt(req.params.z, 10);

    var layer = config.layers[req.params.layer];
    layer.name = req.params.layer;

    var metaTile = new MetaTile(x, y, z, layer.metaTile);
    var url = buildUrl(layer, metaTile);
    console.log(url);

    res.send(metaTile.tileLatLonBounds());
});

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Server listening on port ' + port);