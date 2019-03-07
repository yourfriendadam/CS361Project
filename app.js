var express = require('express');
var mysql = require('./dbcon.js');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var saltRounds = 10;
var session = require('express-session');
var fs = require('fs');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 4961);

app.use(express.static('public'));
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

app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});

// the below is for running from cloud9
// app.listen(process.env.PORT, process.env.IP, function() {
//     console.log("Server is listening");
// });
