var pg = require('pg');
var async = require('async');

var connectionString = 'postgres://localhost:5432/simplify';

function initialize(){
  async.series([
    createUsersTable,

  ], function(err){
    if(err){
      console.log('Error initializing tables:', err);
    } else {
      console.log('Initialized tables successfully.');
    }
  });
}

function createUsersTable(){
  pg.connect(connectionString, function(err, client, done){
    if (err){
      console.log('Error connecting to database:', err);
      process.exit(1); // this is a built-in node thing that lets us kill this node process (i.e. our web server) if there is an error
    } else {
      // create inital schema
      var query = client.query('CREATE TABLE IF NOT EXISTS users ('+
      'id serial PRIMARY KEY,' +
      'spotify_id varchar(80) NOT NULL,'+
      'birthdate date,' +
      'display_name varchar(80),' +
      'email varchar(80),' +
      'image_url varchar(100),' +
      'product varchar(50),' +
      'spotify_url varchar(80),' +
      'saved_albums text[]' +
      ')');

      query.on('end', function(){
        console.log('Successfully created schema');
        done();
      });

      query.on('error', function(error){
        console.log('Error creating schema', error);
        process.exit(1);
      });
    }
  });
}

function createAlbumTable(){
  pg.connect(connectionString, function(err, client, done){
    if (err){
      console.log('Error connecting to database:', err);
      process.exit(1); // this is a built-in node thing that lets us kill this node process (i.e. our web server) if there is an error
    } else {
      // create inital schema
      var query = client.query('CREATE TABLE IF NOT EXISTS albums ('+
      'id serial PRIMARY KEY,' +
      'spotify_id varchar(80) NOT NULL,'+
      'birthdate date,' +
      'display_name varchar(80),' +
      'email varchar(80),' +
      'image_url varchar(100),' +
      'product varchar(50),' +
      'spotify_url varchar(80)' +
      ')');

      query.on('end', function(){
        console.log('Successfully created album schema.');
        done();
      });

      query.on('error', function(error){
        console.log('Error creating schema', error);
        process.exit(1);
      });
    }
  });
}

module.exports.connectionString = connectionString;
module.exports.initialize = initialize;
