var pg = require('pg');
var async = require('async');

var connectionString = 'postgres://localhost:5432/simplify';

function initialize(){
  async.series([
    createUsersTable,
    createAlbumsTable,
    createTracksTable
  ], function(err){
    if(err){
      console.log('Error initializing tables:', err);
    } else {
      console.log('Initialized tables successfully.');
    }
  });
}

function createUsersTable(callback){
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
      'spotify_url varchar(80)' +
      ')');

      query.on('end', function(){
        console.log('Successfully created user schema');
        callback(null);
        done();
      });

      query.on('error', function(error){
        console.log('Error creating user schema', error);
        callback(error);
        process.exit(1);
      });
    }
  });
}

function createArtistsTable(callback){
  pg.connect(connectionString, function(err, client, done){
    if (err){
      console.log('Error connecting to database:', err);
      process.exit(1); // this is a built-in node thing that lets us kill this node process (i.e. our web server) if there is an error
    } else {
      // create inital schema
      var query = client.query('CREATE TABLE IF NOT EXISTS artists ('+
      'id text PRIMARY KEY,' +
      'name varchar(80)' +
      ')');

      query.on('end', function(){
        console.log('Successfully created artist schema.');
        callback(null);
        done();
      });

      query.on('error', function(error){
        console.log('Error creating artist schema', error);
        callback(error);
        process.exit(1);
      });
    }
  });
}

function createAlbumsTable(callback){
  pg.connect(connectionString, function(err, client, done){
    if (err){
      console.log('Error connecting to database:', err);
      process.exit(1); // this is a built-in node thing that lets us kill this node process (i.e. our web server) if there is an error
    } else {
      // create inital schema
      var query = client.query('CREATE TABLE IF NOT EXISTS albums ('+
      'id text PRIMARY KEY,' +
      'artist_name text,' +
      'image_small varchar(80),' +
      'image_medium varchar(80),' +
      'image_large varchar(80),' +
      'name varchar(80),' +
      'duration_ms int,' +
      'release_date text,' + // this is getting borked, it's doing math instead of treating it like a string
      'avg_danceability int,' +
      'avg_energy int,' +
      'avg_valence int,' +
      'popularity int' +
      ')');

      query.on('end', function(){
        console.log('Successfully created album schema.');
        callback(null);
        done();
      });

      query.on('error', function(error){
        console.log('Error creating album schema', error);
        callback(error);
        process.exit(1);
      });
    }
  });
}


function createTracksTable(callback){
  pg.connect(connectionString, function(err, client, done){
    if (err){
      console.log('Error connecting to database:', err);
      process.exit(1); // this is a built-in node thing that lets us kill this node process (i.e. our web server) if there is an error
    } else {
      // create initial schema
      var query = client.query('CREATE TABLE IF NOT EXISTS tracks ('+
      'track_id text PRIMARY KEY,' +
      'album_id text REFERENCES "albums"(id),' +
      'artist_name text,' +
      'track_name text,' +
      'track_number int,' +
      'danceability float,' +
      'duration_ms int,' +
      'key int,' +
      'loudness float,' +
      'speechiness float,' +
      'liveness float,' +
      'tempo int,' +
      'time_signature int,' +
      'energy float,' +
      'valence float,' +
      'popularity int' +
      ')');

      query.on('end', function(){
        console.log('Successfully created tracks schema.');
        callback(null);
        done();
      });

      query.on('error', function(error){
        console.log('Error creating tracks schema', error);
        callback(error);
        process.exit(1);
      });
    }
  });
}

module.exports.connectionString = connectionString;
module.exports.initialize = initialize;
