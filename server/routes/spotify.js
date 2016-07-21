var router = require('express').Router();
var request = require('request');
var authorize = require('./authorize');
var pg = require('pg');
var connectionString = require('../db/connection.js').connectionString;
// var access_token = require('./authorize').access_token;
// var refresh_token = require('./authorize').refresh_token;

router.get('/info', function(req, res){
  // get user info from spotify

  console.log('spotify tokens:', authorize, authorize.access_token, authorize.refresh_token);

  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: {'Authorization': 'Bearer ' + authorize.access_token},
    json: true
  };

  request.get(options, function(err, response, body){
    res.send(body);
  });
});

router.get('/albums', function(req, res){
  console.log('getting albums...');
  var albums = [];
  var options = {
    url: 'https://api.spotify.com/v1/me/albums?limit=50',
    headers: {'Authorization': 'Bearer ' + authorize.access_token},
    json: true
  };

  // recursively get all of a users' saved albums
  var pages = 0;
  var getAlbums = function(err, response, body){
    console.log('Getting page', pages);
    if(body.items){
      // body.items.map(function(album){
      //   albums.push(album);
      // });

      // save albums to database
      pg.connect(connectionString, function(err, client, done){
        if(err){
          console.log('Error connecting to db to store albums.');
        } else {
          // build query string
          var queryString = 'INSERT INTO albums (id, artist_name, image_small, image_medium, image_large, name, release_date, popularity) VALUES ';
          var filteredAlbums = [];

          body.items.map(function(album, index){
            //console.log('building query string album', index);
            // var tempAlbum = [
            //   album.album.id,
            //   album.album.artists[0].id,
            //   album.album.images[2].url,
            //   album.album.images[1].url,
            //   album.album.images[0].url,
            //   album.album.name,
            //   album.album.release_date,
            //   album.album.popularity
            // ];
            //
            // filteredAlbums.push(tempAlbum);

            var re = new RegExp("'", "g");

            var albumName = album.album.name.replace(re, "''");
            var artistName = album.album.artists[0].name.replace(re, "''");

            queryString += `( \'${album.album.id}\', \'${artistName}\', \'${album.album.images[2].url}\', \'${album.album.images[1].url}\', \'${album.album.images[0].url}\', \'${albumName}\', ${album.album.release_date}, ${album.album.popularity})`;
            if(index === body.items.length - 1){
              queryString += ' ON CONFLICT DO NOTHING;';
            } else {
              queryString += ',';
            }
          });

          console.log('queryString:', queryString);

          // var multipleValues = Inserts('$1, $2, $3, $4, $5, $6, $7, $8', filteredAlbums);
          // console.log('multiple values:', multipleValues);

          var query = client.query(queryString);

          query.on('error', function(err){
            console.log('Error saving albums:', err);
            process.exit(1);
          });

          query.on('end', function(){
            console.log('Saved albums.');
            done();
          });
        }
      });

      if(body.next){
        options.url = body.next;
        request.get(options, getAlbums);
      } else {
        console.log('got albums.');
        res.send({albums:albums});
      }
    }
    pages++;
  };

  request.get(options, getAlbums);
});

router.get('/track-features/:trackID', function(req, res){
  console.log('getting track features...');
  var features = {};
  var trackID = req.params.trackID;

  var options = {
    url: 'https://api.spotify.com/v1/audio-features/' + trackID,
    headers: {'Authorization': 'Bearer ' + authorize.access_token},
    json: true
  };

  request.get(options, function(err, response, body){
    console.log('got features.', body);
    res.send(body);
  });
});

router.post('/album-features', function(req, res){
  var tracks = req.body;
  var trackString = '';
  tracks.items.map(function(track, index){
    if(index !== tracks.items.length - 1){
      trackString += track.id + ',';
    } else {
      trackString += track.id;
    }
  });

  var options = {
    url: 'https://api.spotify.com/v1/audio-features?ids=' + trackString,
    headers: {'Authorization': 'Bearer ' + authorize.access_token},
    json: true
  };

  request.get(options, function(err, response, body){
    // console.log('album features body:', body, options);
    body.audio_features.map(function(feature){

      for (num in feature){
        //console.log('type',typeof feature[num]);
        if(typeof feature[num] === 'number'){
          //feature[num] *= 100;
          feature[num] = Math.floor(feature[num] * 100);
        }
      }

      tracks.items.map(function(track){
        if(track.id === feature.id){
          track.features = feature;
        }
      });
    });

    res.send(tracks);
  });
});

// Concatenates an array of objects or arrays of values, according to the template,
// to use with insert queries. Can be used either as a class type or as a function.
//
// template = formatting template string
// data = array of either objects or arrays of values
function Inserts(template, data) {
    if (!(this instanceof Inserts)) {
        return new Inserts(template, data);
    }
    this._rawDBType = true;
    this.formatDBType = function () {
        return data.map(d=>'(' + pgp.as.format(template, d) + ')').join(',');
    };
}



module.exports = router;
