var mysql = require('mysql');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var pool = mysql.createPool({
    connectionLimit: 10,
    host: config.db.host,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
    dateStrings: 'date'
});

pool.getConnection(function(err) {
    if (err) {
        throw err;
    }
    console.log("Connected!");
});

module.exports = pool;