var knox = require('knox');

module.exports = knox.createClient({
    key: process.env.AWS_ACCESS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: 'enirowebcache',
    region: 'eu-west-1'
});