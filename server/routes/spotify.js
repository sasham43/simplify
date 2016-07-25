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

router.get('/albums/stored', function(req, res){
  console.log('getting albums...');
  // var storedAlbums = [];


      var storedAlbums = getAlbumsWithTracks(res, false);
      //res.send({storedAlbums: storedAlbums});

      // var queryString = 'SELECT * FROM tracks INNER JOIN albums ON tracks.album_id = albums.id';
      // var query = client.query(queryString);
      //
      // query.on('error', function(err){
      //   console.log('Error getting albums:', err);
      //   process.exit(1);
      // });
      //
      // var tempAlbum = {album_id: '', tracks:[]};
      // query.on('row', function(row){
      //   //console.log('row:', row);
      //
      //   if((row.album_id !== tempAlbum.album_id) && (tempAlbum.album_id !== '')){
      //     storedAlbums.push(tempAlbum);
      //     tempAlbum = {album_id: row.album_id, tracks:[]};
      //   }
      //   tempAlbum.album_id = row.album_id;
      //   tempAlbum.name = row.name;
      //   tempAlbum.popularity = row.popularity;
      //   tempAlbum.image_small = row.image_small;
      //   tempAlbum.image_medium = row.image_medium;
      //   tempAlbum.image_large = row.image_large;
      //   tempAlbum.artist_name = row.artist_name;
      //   tempAlbum.tracks.push(row);
      // });
      //
      // query.on('end', function(){
      //   console.log('Got saved albums.');
      //   res.send({storedAlbums: storedAlbums});
      //   done();
      // });
});

router.get('/albums/update', function(req, res){
  console.log('updating albums...');
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
      body.items.map(function(album){
        albums.push(album);
      });

      // save albums to database
      pg.connect(connectionString, function(err, client, done){
        if(err){
          console.log('Error connecting to db to store albums.');
        } else {
          // build query string
          var queryString = 'INSERT INTO albums (id, artist_name, image_small, image_medium, image_large, name, release_date, popularity, link) VALUES ';
          var filteredAlbums = [];

          body.items.map(function(album, index){
            var re = new RegExp("'", "g");

            var albumName = album.album.name.replace(re, "''");
            var artistName = album.album.artists[0].name.replace(re, "''");

            queryString += `( \'${album.album.id}\', \'${artistName}\', \'${album.album.images[2].url}\', \'${album.album.images[1].url}\', \'${album.album.images[0].url}\', \'${albumName}\', ${album.album.release_date}, ${album.album.popularity}, \'${album.album.uri}\')`;
            if(index === body.items.length - 1){
              queryString += ' ON CONFLICT DO NOTHING;';
            } else {
              queryString += ',';
            }
          });

          console.log('queryString:', queryString);

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
        console.log('albums:', albums);
        // save tracks to database
        pg.connect(connectionString, function(err, client, done){
          if(err){
            console.log('Error connecting to database:', err);
          } else {
            var queryString = 'INSERT INTO tracks (track_id, album_id, artist_name, track_name, track_number, duration_ms, track_link) VALUES ';

            // build query string
            albums.map(function(album, index){
              //console.log('tracks album:', album);
              album.album.tracks.items.map(function(track, ti){
                var re = new RegExp("'", "g"); // sanitize input
                var artistName = album.album.artists[0].name.replace(re, "''");
                var trackName = track.name.replace(re, "''");

                queryString += `(\'${track.id}\', \'${album.album.id}\', \'${artistName}\', \'${trackName}\', ${track.track_number}, ${track.duration_ms}, \'${track.uri}\')`;
                if(ti === album.album.tracks.items.length - 1){
                  queryString += '';
                } else {
                  queryString += ',';
                }
              });
              if(index === albums.length - 1){
                queryString += ' ON CONFLICT DO NOTHING;';
              } else {
                queryString += ',';
              }
            });

            //console.log('queryString:', queryString);

            var query = client.query(queryString);

            query.on('error', function(err){
              console.log('Error saving tracks:', err);
              process.exit(1);
            });

            query.on('end', function(){
              console.log('Saved tracks.');
              done();
            });
          }
        });

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
  tracks.map(function(track, index){
    if(index !== tracks.length - 1){
      trackString += track.track_id + ',';
    } else {
      trackString += track.track_id;
    }
  });

  var options = {
    url: 'https://api.spotify.com/v1/audio-features?ids=' + trackString,
    headers: {'Authorization': 'Bearer ' + authorize.access_token},
    json: true
  };

  request.get(options, function(err, response, body){
     //console.log('album features body:', body, options);
    // body.audio_features.map(function(feature){
    //
    //   for (num in feature){
    //     //console.log('type',typeof feature[num]);
    //     if(typeof feature[num] === 'number'){
    //       //feature[num] *= 100;
    //       feature[num] = Math.floor(feature[num] * 100);
    //     }
    //   }
    //
    //   tracks.map(function(track){
    //     if(track.track_id === feature.id){
    //       track.features = feature;
    //     }
    //   });
    // });

    tracks = filterAudioFeatures(body, tracks);

    res.send(tracks);
  });
});

router.get('/features/albums', function(req, res){
  var storedAlbums = getAlbumsWithTracks(res, true);


});

function getAlbumsWithTracks(res, local){
  pg.connect(connectionString, function(err, client, done){
    if(err){
      console.log('Error connecting to db to get albums.');
    } else {
      var storedAlbums = [];
      var queryString = 'SELECT * FROM tracks INNER JOIN albums ON tracks.album_id = albums.id';
      var query = client.query(queryString);

      query.on('error', function(err){
        console.log('Error getting albums:', err);
        process.exit(1);
      });

      var tempAlbum = {album_id: '', tracks:[]};
      query.on('row', function(row){
        //console.log('row:', row);

        if((row.album_id !== tempAlbum.album_id) && (tempAlbum.album_id !== '')){
          storedAlbums.push(tempAlbum);
          tempAlbum = {album_id: row.album_id, tracks:[]};
        }
        tempAlbum.album_id = row.album_id;
        tempAlbum.name = row.name;
        tempAlbum.popularity = row.popularity;
        tempAlbum.image_small = row.image_small;
        tempAlbum.image_medium = row.image_medium;
        tempAlbum.image_large = row.image_large;
        tempAlbum.artist_name = row.artist_name;
        tempAlbum.link = row.link;
        tempAlbum.tracks.push(row);
      });

      query.on('end', function(){
        console.log('Got saved albums.');
        if(local){
          storedAlbums.map(function(album){
            // build query string
            var ids = 'ids=';
            album.tracks.map(function(track, index){
              ids += track.track_id;
              if(index !== album.tracks.length - 1){
                ids += ',';
              }
            });

            var options = {
              url: 'https://api.spotify.com/v1/audio-features/?' + ids,
              headers: {'Authorization': 'Bearer ' + authorize.access_token},
              json: true
            };

            // get audio features from spotify
            request.get(options, function(err, response, body){
              if(err){
                console.log('Failed to get audio features from spotify:', err);
              } else {
                //console.log('body:', body);
                album.tracks = filterAudioFeatures(body, album.tracks);

                pg.connect(connectionString, function(err, client, done){
                  if(err){
                    console.log('Error connecting to db:', err);
                  } else {
                    var queryString = 'UPDATE tracks SET (danceability, ' +
                      'key = c.key' +
                      'loudness = c.loudness, ' +
                      'speechiness = c.speechiness, ' +
                      'liveness = c.liveness, ' +
                      'tempo = c.tempo, ' +
                      'time_signature = c.time_signature, ' +
                      'energy = c.energy, ' +
                      'valence = c.valence,' +
                      ') FROM (VALUES ';
                    var queryEnd = ' ) AS c(track_id, key, loudness, speechiness, liveness, tempo, time_signature, energy, valence) WHERE c.track_id = tracks.track_id;';

                    album.tracks.map(function(trackObject, index){
                      var track = trackObject.features;
                      console.log(track);
                      queryString += `(${track.key}, ${track.loudness}, ${track.speechiness}, ${track.liveness}, ${track.tempo}, ${track.time_signature}, ${track.energy}, ${track.valence})`;
                      if(index !== album.tracks.length - 1){
                        queryString += ',';
                      } else {
                        queryString += queryEnd;
                      }
                    });

                    console.log('queryString:', queryString);
                    var query = client.query(queryString);

                    query.on('error', function(err){
                      console.log('Error saving audio features:', err);
                      process.exit(1);
                    });

                    query.on('end', function(){
                      console.log('Saved audio features.');
                      done();
                      res.send({storedAlbums: storedAlbums});
                    });
                  }
                });
              }
            });
          });
        } else {
          res.send({storedAlbums: storedAlbums});
        }
        //res.send({storedAlbums: storedAlbums});
        //return storedAlbums;
        done();
      });
    }
  });
}

function filterAudioFeatures(body, tracks){
  body.audio_features.map(function(feature){

    for (num in feature){
      //console.log('type',typeof feature[num]);
      if(!Number.isInteger(feature[num])){
        //feature[num] *= 100;
        feature[num] = Math.floor(feature[num] * 100);
      }
    }
    //console.log('tracks:', tracks);
    tracks.map(function(track){
      if(track.track_id === feature.id){
        track.features = feature;
      }
    });
  });
  //console.log('tracks:', tracks);
  return tracks;
}

module.exports = router;
