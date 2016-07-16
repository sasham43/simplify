var pg = require('pg');

var connectionString = 'postgres://localhost:5432/simplify';

function initialize(){
  pg.connect(connectionString, function(err, client, done){
    if (err){
      console.log('Error connecting to database:', err);
      process.exit(1); // this is a built-in node thing that lets us kill this node process (i.e. our web server) if there is an error
    } else {
      // create inital schema
      var query = client.query('CREATE TABLE IF NOT EXISTS users ('+
      'id serial PRIMARY KEY,' +
      'spotifyID varchar(80) NOT NULL)');

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

module.exports.connectionString = connectionString;
module.exports.initialize = initialize;
