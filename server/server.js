require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
var port = process.env.PORT || 3000;

////////////import modules//////////
var index = require('./routes/index');
var authorize = require('./routes/authorize');


//////////// config /////////////
app.use(express.static('server/public'));
app.use(bodyParser.json());
app.use(cookieParser());




///////////routes/////////////
app.use('/authorize', authorize);
app.use('/', index);



//listen
app.listen(port, function() {
  console.log('listening on port', port + '...');
});
