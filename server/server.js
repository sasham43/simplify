require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require('express-session');
var pg = require('pg');

var app = express();
var port = process.env.PORT || 3000;

////////////import modules//////////
var connection = require('./db/connection.js');
var index = require('./routes/index');
var authorize = require('./routes/authorize').router;
var spotify = require('./routes/spotify');


//////////// config /////////////
app.use(express.static('server/public'));
app.use(bodyParser.json());
app.use(cookieParser());




///////////routes/////////////
app.use('/authorize', authorize);
app.use('/spotify', spotify);
app.use('/', index);

// db
connection.initialize();

//listen
app.listen(port, function() {
  console.log('listening on port', port + '...');
});
