var MetaTile = require('./metatile');

var Layer = module.exports = function (name, options) {
    this.name = name;
    this.options = options;
}

Layer.prototype.metaTile = function (x, y, z) {
    return new MetaTile(x, y, z, this.options.metaTile);
}

Layer.prototype.buildUrl = function (metaTile) {
    var params = [];
    params.push('service=WMS');
    params.push('version=1.1.0');
    params.push('request=GetMap');
    params.push('format=' + this.options.format);
    params.push('srs=' + this.options.srs);
    params.push('layers=' + this.name);
    params.push('width=' + metaTile.width);
    params.push('height=' + metaTile.height);

    var bounds = metaTile.tileLatLonBounds();
    params.push('bbox=' + [bounds.min.lon, bounds.min.lat, bounds.max.lon, bounds.max.lat].join(','));

    return this.options.url + '?' + params.join('&');
};