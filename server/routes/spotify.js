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
    res.send({
      body: body,
      token: authorize.access_token
    });
  });
});

router.get('/albums/stored', function(req, res){
  console.log('getting albums...');
      pg.connect(connectionString, function(err, client, done){
          if(err){
            console.log('Error connecting to db to get albums.');
          } else {
            var storedAlbums = [];

      var queryString = 'SELECT * FROM tracks INNER JOIN albums ON tracks.album_id = albums.id ORDER BY album_id DESC, track_number ASC;';
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
        tempAlbum.tracks.push(row);
      });

      query.on('end', function(){
        console.log('Got saved albums.');
        res.send({storedAlbums: storedAlbums});
        done();
      });
    }
  });
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
    if(err){
      console.log('Error getting albums.');
    }
    console.log('Getting page', pages, body);
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
    } else if(body.error) {
      console.log('Error.');
      res.send(body);
    }
    pages++;
  };

  request.get(options, getAlbums);
});

// ascii
var Jimp = require("jimp");
const download = require('image-downloader')
const imageToAscii = require("image-to-ascii");

router.get('/ascii', function(req, res, next){

  getStatus(function(body){
    var image = body.item ? body.item.album.images[0].url : '';
    console.log(body);
    // var image = process.argv[2] || 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/NirvanaNevermindalbumcover.jpg/220px-NirvanaNevermindalbumcover.jpg';
    // Download to a directory and save with the original filename
    const options = {
      url: image,
      dest: './cover.jpg'                  // Save to /path/to/dest/image.jpg
    };

    const ascii_options = {
        colored: false,
        size_options: {
            screen_size: {
                width: 24,
                height: 12
            },
            // preserve_aspect_ratio: false,
            fit_screen: false
        },
        // pixels: ' @PL.,_-/"'
        // pixels: "@80GCL1;:,. "
        pixels: " .,:;1GCL08@"
    };
    console.log('going')
    download.image(options)
      .then(({ filename, image }) => {
        console.log('File saved to', filename);
        // open a file called "lenna.png"
        Jimp.read(filename, function (err, pic) {
            if (err) throw err;
            console.log('size:', pic.bitmap.width, pic.bitmap.height)
            pic.resize(pic.bitmap.width * 2, pic.bitmap.height)            // resize
                 .quality(100)                 // set JPEG quality
                 .greyscale()                 // set greyscale
                 .write("out.jpg", function(err, done){
                     imageToAscii("out.jpg", ascii_options, (err, converted) => {
                         console.log(err || converted);
                         res.send(converted)
                     });
                 }); // save
        });
      }).catch((err) => {
        throw err
      })
  })

  function getStatus(cb){
    var options = {
      url: 'https://api.spotify.com/v1/me/player/',
      headers: {'Authorization': 'Bearer ' + authorize.access_token},
      json: true
    };

    request.get(options, function(err, response, body){
      if(err)
        console.log('err', err);

      var playing = '';
      if(body.is_playing){
        playing = 'track playing';
      } else {
        playing = 'track paused';
      }

      cb(body)
      // socket.emit('status', {status: playing, album: album, trackNumber: trackNumber, examineAlbum: examineAlbum, track: body.item});
    });
  }
});



module.exports = router;
