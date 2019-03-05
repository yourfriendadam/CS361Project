var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_benckesa',
  password        : '5697',
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
