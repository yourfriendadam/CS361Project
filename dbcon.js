var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs361_benckesa',
  password        : '****',
  database        : 'cs361_benckesa',
  dateStrings     : 'date'
});

pool.getConnection(function(err) {
  if(err) {
    throw err;
  }
  console.log("Connected!");
});

module.exports = pool;
