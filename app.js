// Node packages
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
var bcrypt = require('bcrypt');

// Local files
var mysql = require('./dbcon.js');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Express and Handlebars variables
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

// Bcrypt password salt configuration
var saltRounds = 10;

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', config.server.port);
app.set('ip', config.server.ip);

app.use(express.static('static'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use( session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: true
}));

app.get("/",function(req,res) {
  var context = {};
  context.title = 'Log In';
  //landing page currently set to create account page
  res.render('login', context);  
});

app.get("/createAccount",function(req,res) {
  var context = {};
  context.title = 'Create Account';
  //landing page currently set to create account page
  res.render('createAccount', context);  
});

app.post("/createAccount", function(req, res) {
  var context = {};
  var q1 = 'INSERT INTO Users (username, password) VALUES (?, ?)';  
  var inserts = [req.body.username, req.body.password];
  bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(inserts[1], salt, function(err, salt) {
      if(err) throw err;
      inserts = [req.body.username, salt];
      mysql.query(q1, inserts, function(err, result) {
        if(err) {
          console.log(err);
          context.errorText = "Username already exists. Please try another.";
        }
        context.successText = "Account successfully created!";
        res.render('createAccount', context);
      });      
    });
  });
});

app.post("/login", function(req, postres) {
  var context = {};
  var q1 = 'SELECT ID, username, password FROM Users WHERE username = ?';
  var inserts = [req.body.username];
  mysql.query(q1, inserts, function(err, sqlres) {
    if(err) {
      console.log(err);
      context.errorText = "LOGIN ERROR PLZ TRY AGAIN.";
      postres.render('login', context);
    }
    parsedSql = JSON.parse(JSON.stringify(sqlres));
    bcrypt.compare(req.body.password, parsedSql[0].password, function(err, bcryptres) {
      if(bcryptres == true) {
        context.successText = "Login success!";
        context.userID = parsedSql[0].ID;   //FOR DIAGNOSTICS ONLY
        session.userID = parsedSql[0].ID;
        postres.render('foo', context);
      } else {
        console.log("Incorrect username/password.");
        console.log(bcryptres);
        console.log(err);
        context.errorText = "Incorrect username/password.";
        postres.render('foo', context);
      }
    });
  });
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), app.get('ip'), function(){
    console.log('Express started on http://' + app.get('ip') + ':' +
      app.get('port') + '; press Ctrl-C to terminate.');
});

// the below is for running from cloud9
// app.listen(process.env.PORT, process.env.IP, function() {
//     console.log("Server is listening");
// });
