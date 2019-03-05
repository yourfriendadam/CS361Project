var mysql = require('mysql');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_benckesa',
  password        : config.dbpassword,
  database        : 'cs340_benckesa',
  dateStrings     : 'date'
});

pool.getConnection(function(err) {
  if(err) {
    throw err;
  }
  console.log("Connected!");
});

module.exports = pool;
