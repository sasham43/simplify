require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var SpotifyStrategy = require('passport-spotify').Strategy;
var session = require('express-session');
var pg = require('pg');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

////////////import modules//////////
var connection = require('./db/connection.js');
var index = require('./routes/index');
var play = require('./routes/play');
var authorize = require('./routes/authorize').router;
var spotify = require('./routes/spotify');


//////////// config /////////////
app.use(express.static('server/public'));
app.use(bodyParser.json());
app.use(cookieParser());
//express session
app.use(session({
  secret: 'teal walls',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 3600000, secure: false}
}));
//initializing passport//
app.use(passport.initialize());
app.use(passport.session());



///////////routes/////////////
app.use('/authorize', authorize);
app.use('/spotify', spotify);
app.use('/play', play);
app.use('/', index);

// db
connection.initialize();

io.on('connection', function(socket){
  socket.emit('test', {object: 'object'});
  socket.on('client test', function(data){
    console.log('client test response:', data);
  });
});

server.listen(port);

//listen
// app.listen(port, function() {
//   console.log('listening on port', port + '...');
// });
