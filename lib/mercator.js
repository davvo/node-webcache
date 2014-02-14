var tileSize = 256,
    initialResolution = 2 * Math.PI * 6378137 / tileSize,
    originShift = 2 * Math.PI * 6378137 / 2;

// Resolution (meters/pixel) for given zoom level (measured at Equator)
function resolution(zoom) {
    return initialResolution / Math.pow(2, zoom);
}

var mercator = module.exports = {

    tileSize: tileSize,

    // Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913
    latLonToMeters: function (lat, lon) {
        var mx = lon * originShift / 180,
            my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        my = my * originShift / 180;
        return {
            x: mx,
            y: my
        };
    },

    // Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84 Datum
    metersToLatLon: function (mx, my) {
        var lon = (mx / originShift) * 180,
            lat = (my / originShift) * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return {
            lat: lat, 
            lon: lon
        };
    },

    // Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
    pixelsToMeters: function (px, py, zoom) {
        var res = resolution(zoom);
        return {
            x: px * res - originShift,
            y: py * res - originShift
        };
    },
        
    // Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
    metersToPixels: function (mx, my, zoom) {
        var res = resolution(zoom);
        return {
            x: (mx + originShift) / res,
            y: (my + originShift) / res
        };
    },
    
    // Returns a tile covering region in given pixel coordinates
    pixelsToTile: function (px, py) {
        return {
            x: Math.floor(px / tileSize), 
            y: Math.floor(py / tileSize)
        };
    },
        
    // Returns tile for given mercator coordinates
    metersToTile: function (mx, my, zoom) {
        var pixels = mercator.metersToPixels(mx, my, zoom);
        return mercator.pixelsToTile(pixels.x, pixels.y);
    },
        
    // Returns bounds of the given tile in EPSG:900913 coordinates
    tileBounds: function (tx, ty, zoom) {
        return {
            min: mercator.pixelsToMeters(tx * tileSize, ty * tileSize, zoom),
            max: mercator.pixelsToMeters((tx + 1) * tileSize, (ty + 1) * tileSize, zoom)
        };
    },

    // Returns bounds of the given tile in latutude/longitude using WGS84 datum
    tileLatLonBounds: function (tx, ty, zoom) {
        var bounds = mercator.tileBounds(tx, ty, zoom);
        return {
            min: mercator.metersToLatLon(bounds.min.x, bounds.min.y),
            max: mercator.metersToLatLon(bounds.max.x, bounds.max.y)
        };
    }
};