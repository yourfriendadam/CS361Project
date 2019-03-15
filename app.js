// Node packages
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');
var parallel = require('run-parallel');

// Local files
var mysql = require('./dbcon.js');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Express and Handlebars variables
var app = express();
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main',
});

// Bcrypt password salt configuration
var saltRounds = 10;

// mysql session store options
var sessionStore = new MySQLStore({}, mysql);

// Initializes the context varable with initial username value
function initContext(req) {
    var context = {};
    if (req.session.username) {
        context.username = req.session.username;
    }
    return context;
}

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', config.server.port);
app.set('ip', config.server.ip);

app.use(express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(session({
    secret: config.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: true
}));

app.get("/", function(req, res) {
    var context = initContext(req);
    context.title = 'Gaslite';
    res.render('landing', context);
});

app.get("/login", function(req, res) {
    var context = initContext(req);
    context.title = 'Log In';
    res.render('login', context);
});

app.get("/logout", function(req, res) {
    var context = initContext(req);
    context.title = 'Log Out';
    res.render('logout', context);
});

app.get("/createAccount", function(req, res) {
    var context = initContext(req);
    context.title = 'Create Account';
    //landing page currently set to create account page
    res.render('createAccount', context);
});

app.get("/shower", function(req, res) {
    var context = initContext(req);
    context.title = 'Take a shower';
    var q1 = 'SELECT * FROM Showers WHERE user_id = ?';
    var inserts = [req.session.userID];
    mysql.query(q1, inserts, function(err, sqlres) {
        if (err) {
            console.log(err);
            context.errorText = "Error retrieving showers plz try again.";
        }
        context.showers = JSON.parse(JSON.stringify(sqlres));
        res.render('shower', context);
    });
});

// Calls the callback function with the ecoscore
function calcEcoscore(userID, callback) {
    var inserts = [userID];
    var functions = {
        showers: function(callback) {
            mysql.query('SELECT shower_time FROM Showers WHERE user_id = ?', inserts, callback)
        },
        food: function(callback) {
            mysql.query('SELECT foodType FROM Food WHERE userID = ?', inserts, callback)
        },
        electricity: function(callback) {
            mysql.query('SELECT amount FROM Electricity WHERE user_id = ?', inserts, callback)
        },
        transportation: function(callback) {
            mysql.query('SELECT distance,mpg FROM Transportation WHERE user_id = ?', inserts, callback)
        },
        water: function(callback) {
            mysql.query('SELECT faucet,flushes,shower FROM Water WHERE userID = ?', inserts, callback)
        },
    };

    // Run each of the above functions in parallel, then parse the results
    // in a combined object called 'results'
    parallel(functions, function(err, results) {
            if (err) {
                console.log(err);
                callback(err, -1);
            }
            results = JSON.parse(JSON.stringify(results));

            // Start eco-score at 1000 pts, and subtract or add from there
            ecoscore = 1000;

            // parse food
            results.food.forEach(function(foodEntry) {
                switch (foodEntry.foodType) {
                    case 'meat':
                        ecoscore += 10;
                        break;
                    case 'fat':
                        ecoscore += 5;
                        break;
                    case 'half':
                        ecoscore -= 5;
                        break;
                    case 'veggie':
                        ecoscore -= 10;
                        break;
                    default:
                        console.log("Invalid food type: ", foodEntry.foodType);
                }
            });
            // parse showers
            results.showers.forEach(function(showerEntry) {
                var timeStr = showerEntry.shower_time.split(":");
                var seconds = (timeStr[0] * 60 * 60) + (timeStr[1] * 60) +
                    timeStr[2];
                // Assuming average 5 minute shower, 1 pt for 5 minutes
                ecoscore += (seconds - (5 * 60)) / 5;
            });
            // parse electricity
            results.electricity.forEach(function(electricityEntry) {
                // Assuming average $150 electricity bill
                ecoscore += (electricityEntry.amount - 150)/10;
            });
            // parse transportation
            results.transportation.forEach(function(transportationEntry) {
                // Transportation type is free-form, so we can't use it
                ecoscore += (transportationEntry.distance *
                    transportationEntry.mpg) / 10;
            });
            // parse water
            results.water.forEach(function(waterEntry) {
                ecoscore += (waterEntry.faucet * 3) + (waterEntry.flushes * 5) +
                    (waterEntry.shower * 7) - 25;
            });
            // Finally, call the callback with the freshly minted ecoscore
            callback(err, Math.ceil(ecoscore));
    });
}

app.get("/ecoscore", function(req, res) {
    var context = initContext(req);
    context.title = 'Your eco-score';

    if (req.session.userID) {
        calcEcoscore(req.session.userID, function(err, ecoscore) {
            if (err) {
                console.log(err);
                context.errorText = "Error retrieving plz try again.";
                res.render('ecoscore', context);
                return;
            }
            context.ecoscore = ecoscore;
            res.render('ecoscore', context);
        });
    } else {
      res.render('ecoscore', context);
    }
});

app.get("/electricity", function(req, res) {
    var context = initContext(req);
    context.title = 'Record Electricity Use';
    res.render('electricity', context);
});

app.get("/food", function(req, res) {
    var context = initContext(req);
    context.title = 'Record Food Consumption';
    var q1 = 'SELECT * FROM Food WHERE userID = ?';
    var inserts1 = [session.userID];
    mysql.query(q1, inserts1, function(err, sqlres1) {
        if (err) {
            console.log(err);
            context.errorText = "Error retrieving food plz try again.";
        }
        context.food = JSON.parse(JSON.stringify(sqlres1));
        res.render('food', context);
    });
});


app.get("/water", function(req, res) {
    var context = initContext(req);
    context.title = 'Record Water Usage';
    res.render('water', context);
});

app.get("/transportation", function(req, res) {
    var context = initContext(req);
    context.title = 'Transportation Info';
    var q1 = 'SELECT * FROM Transportation WHERE user_id = ?';
    var inserts1 = [req.session.userID];
    mysql.query(q1, inserts1, function(err, sqlres1) {
        if (err) {
            console.log(err);
            context.errorText = "Error retrieving transport plz try again.";
        }
        context.transport = JSON.parse(JSON.stringify(sqlres1));
        res.render('transportation', context);
    });
});

app.post("/saveShower", function(req, res) {
    var context = initContext(req);
    var dateObj = new Date();
    var showerData = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDay(), 0, 0, 0, req.body.watchvalsubmit));
    var showerTime = showerData.getUTCHours() + ":" + showerData.getUTCMinutes() + ":" + showerData.getUTCSeconds();
    var showerDate = showerData.getUTCFullYear() + "-" + (showerData.getUTCMonth() + 1) + "-" + showerData.getUTCDate();

    var q1 = 'INSERT INTO Showers (user_id, shower_date, shower_time) VALUES (?, ?, ?)';
    var inserts = [req.session.userID, showerDate, showerTime];
    mysql.query(q1, inserts, function(err, result) {
        if (err) {
            console.log(err);
            context.errorText = "Error inserting data plz try again.";
        }
        context.successText = "Data successfully inserted!";
        var q2 = 'SELECT * FROM Showers WHERE user_id = ?';
        var inserts2 = [req.session.userID];
        mysql.query(q2, inserts2, function(err, sqlres2) {
            if (err) {
                console.log(err);
                context.errorText = "Error retrieving showers plz try again.";
            }
            context.showers = JSON.parse(JSON.stringify(sqlres2));
            res.render('shower', context);
        });
    });
});

app.post('/food', function(req, res) {
    var context = initContext(req);
    var q1 = 'INSERT INTO Food (userID, foodType, Description) VALUES (?, ?, ?)';
    var inserts = [req.session.userID, req.body.foodType, req.body.foodDesc];
    mysql.query(q1, inserts, function(err, result) {
        if (err) {
            if (err.code === 'ER_BAD_NULL_ERROR') {
                context.errorText = "You are not currently logged in. Please go to the login page.";
            } else {
                context.errorText = "Unknown error!";
            }
        } else {
            context.successText = "Data successfully inserted!";
        }
        var q2 = 'SELECT * FROM Food WHERE userID = ?';
        var inserts2 = [session.userID];
        mysql.query(q2, inserts2, function(err, sqlres2) {
            if (err) {
                console.log(err);
                context.errorText = "Error retrieving food plz try again.";
            }
            context.food = JSON.parse(JSON.stringify(sqlres2));
            res.render('food', context);
        });
    });
});

app.post('/water', function(req, res) {
    var context = initContext(req);

    var q1 = 'INSERT INTO Water (userID, faucet, flushes, shower) VALUES (?, ?, ?, ?)';
    var inserts = [req.session.userID, req.body.faucet, req.body.flushes, req.body.shower];
    mysql.query(q1, inserts, function(err, result) {
        if (err) {
            if (err.code === 'ER_BAD_NULL_ERROR') {
                context.errorText = "You are not currently logged in. Please go to the login page.";
            } else {
                context.errorText = "Unknown error!";
                console.log(err);
            }
        }
        res.render('water', context);
    });
});

app.post("/saveTransportation", function(req, res) {
    var context = initContext(req);

    var q1 = 'INSERT INTO Transportation (user_id, distance, mpg, transportation_type, transportation_date) VALUES (?, ?, ?, ?, ?)';
    var inserts = [req.session.userID, req.body.distance, req.body.mpg, req.body.transportationType, req.body.transportationDate];
    mysql.query(q1, inserts, function(err, result) {
        if (err) {
            console.log(err);
            context.errorText = "Error inserting data plz try again.";
        }
        context.successText = "Data successfully inserted!";
        var q2 = 'SELECT * FROM Transportation WHERE user_id = ?';
        var inserts2 = [req.session.userID];
        mysql.query(q2, inserts2, function(err, sqlres2) {
            if (err) {
                console.log(err);
                context.errorText = "Error retrieving transport plz try again.";
            }
            context.transport = JSON.parse(JSON.stringify(sqlres2));
            res.render('transportation', context);
        });
    });
});

app.post("/createAccount", function(req, res) {
    var context = initContext(req);
    var q1 = 'INSERT INTO Users (username, password) VALUES (?, ?)';
    var inserts = [req.body.username, req.body.password];
    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(inserts[1], salt, function(err, salt) {
            if (err) throw err;
            inserts = [req.body.username, salt];
            mysql.query(q1, inserts, function(err, result) {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        context.errorText = "Username already exists. Please try another.";
                    } else {
                        context.errorText = "Unknown error!";
                        console.log(err);
                    }
                }
                context.successText = "Account successfully created!";
                res.render('createAccount', context);
            });
        });
    });
});

app.post("/logout", function(req, postres) {
    var context = initContext(req);
    if (context.username) {
        delete req.session.username;
        delete req.session.userID;
        context = {};
        context.title = 'Log in';
        context.successText = "Successfully logged out!";
        postres.render('login', context);
        return;
    }
    postres.render('logout', context);
});

app.post("/login", function(req, postres) {
    var context = initContext(req);
    var q1 = 'SELECT ID, username, password FROM Users WHERE username = ?';
    var inserts = [req.body.username];

    mysql.query(q1, inserts, function(err, sqlres) {
        if (err) {
            console.log(err);
            context.errorText = "LOGIN ERROR PLZ TRY AGAIN.";
            context.title = 'Log In';
            postres.render('login', context);
            return;
        }
        // If no users are found throw error
        if (sqlres.length == 0) {
            context.errorText = "LOGIN ERROR PLZ TRY AGAIN.";
            context.title = 'Log In';
            postres.render('login', context);
            return;
        }
        parsedSql = JSON.parse(JSON.stringify(sqlres));
        bcrypt.compare(req.body.password, parsedSql[0].password, function(err, bcryptres) {
            if (bcryptres == true) {
                context.successText = "Login success!";
                context.userID = parsedSql[0].ID; //FOR DIAGNOSTICS ONLY
                req.session.userID = parsedSql[0].ID;
                req.session.username = parsedSql[0].username;
                context.username = parsedSql[0].username;
                postres.render('foo', context);
                return;
            } else {
                console.log("Incorrect username/password.");
                console.log(bcryptres);
                console.log(err);
                context.errorText = "Incorrect username/password.";
                postres.render('login', context);
                return;
            }
        });
    });
});

app.get("/trackMenu", function(req, res) {
    var context = initContext(req);
    context.title = 'Tracking Menu';
    res.render('foo', context);
});

app.use(function(req, res) {
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), app.get('ip'), function() {
    console.log('Express started on http://' + app.get('ip') + ':' +
        app.get('port') + '; press Ctrl-C to terminate.');
});

// the below is for running from cloud9
// app.listen(process.env.PORT, process.env.IP, function() {
//     console.log("Server is listening");
// });
