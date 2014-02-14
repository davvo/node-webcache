var mercator = require('./mercator');

var MetaTile = module.exports = function (x, y, z, options) {
    this.options = options || {};
    this.size = options.size || 3;
    this.width = mercator.tileSize * this.size;
    this.height = this.width;
    this.x = Math.floor(x / this.width) * this.width;
    this.y = Math.floor(y / this.height) * this.height;
    this.z = z;
};
    
MetaTile.prototype.tileBounds = function () {
    var min = mercator.tileBounds(this.x, this.y, this.z);
    var max = mercator.tileBounds(this.x + this.size - 1, this.y + this.size - 1, this.z);
    return {
        min: min.min,
        max: max.max
    }
};

MetaTile.prototype.tileLatLonBounds = function (zoom) {
    var min = mercator.tileLatLonBounds(this.x, this.y, this.z);
    var max = mercator.tileLatLonBounds(this.x + this.size - 1, this.y + this.size - 1, this.z);
    return {
        min: min.min,
        max: max.max
    }
};