var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var player = spotify.player;

spotify.on({
  ready: ready
});

spotify.login(spotifyUser, spotifyPass, false, false);

var ready = function(){
  console.log('spotify play loaded.');
};

router.get('/album/:albumLink', function(req, res){
  var albumLink = req.params.albumLink;
  console.log('albumLInk:', albumLink);
  var album = spotify.createFromLink(albumLink);
  album.browse(function(err, thisAlbum){
  if(err){
    console.log('error browsing album:', err);
  } else {
    var tracks = thisAlbum.tracks;
    // var track = tracks[0];
    // spotify.player.play(track);
    var trackCount = 2;
    var playAlbum = function(){
      var track = tracks[trackCount];
      player.play(track);
      console.log('playing:', track.name);
      player.on({
        endOfTrack: function(){
        console.log('track ended.');
        trackCount++;
        playAlbum();
      }
    });
    };
    playAlbum();
  }
});

});

router.post('/track', function(req, res){
  var trackLink = req.body.track_link;
  //console.log('request body:', req.body);

  var track = spotify.createFromLink(trackLink);
  console.log('playing:', track);
  player.play(track);
  res.send({message: 'track playing'});
  player.on({
    endOfTrack: function(){
      console.log('track finished.');
      res.send({message: 'track finished'});
    }
  });
});


module.exports = router;
