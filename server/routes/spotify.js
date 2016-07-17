var router = require('express').Router();
var request = require('request');
var authorize = require('./authorize');
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
  var albums = [];
  var options = {
    url: 'https://api.spotify.com/v1/me/albums?limit=50',
    headers: {'Authorization': 'Bearer ' + authorize.access_token},
    json: true
  };

  var getAlbums = function(err, response, body){
    if(body.items){
      body.items.map(function(album){
        albums.push(album);
      });

      if(body.next){
        options.url = body.next;
        request.get(options, getAlbums);
      } else {
        res.send({albums:albums});
      }  
    }
  };

  request.get(options, getAlbums);
});



module.exports = router;
