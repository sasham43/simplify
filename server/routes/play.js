var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;

spotify.on({
  ready: ready
});

spotify.login(spotifyUser, spotifyPass, false, false);

var ready = function(){
  console.log('spotify play loaded.');
};


// router.get('/album/:albumLink', function(req, res){
//   var albumLink = req.params.albumLink;
//   console.log('albumLInk:', albumLink);
//   var album = spotify.createFromLink(albumLink);
//   album.browse(function(err, thisAlbum){
//   if(err){
//     console.log('error browsing album:', err);
//   } else {
//     var tracks = thisAlbum.tracks;
//     // var track = tracks[0];
//     // spotify.player.play(track);
//     var trackCount = 2;
//     var playAlbum = function(){
//       var track = tracks[trackCount];
//       player.play(track);
//       console.log('playing:', track.name);
//       player.on({
//         endOfTrack: function(){
//         console.log('track ended.');
//         trackCount++;
//         playAlbum();
//       }
//     });
//     };
//     playAlbum();
//   }
// });
//
// });
//
// router.post('/track', function(req, res){
//   var trackLink = req.body.track_link;
//   //console.log('request body:', req.body);
//
//   var track = spotify.createFromLink(trackLink);
//   console.log('playing:', track);
//   player.play(track);
//   res.send({message: 'track playing'});
//   player.on({
//     endOfTrack: function(){
//       console.log('track finished.');
//       res.send({message: 'track finished'});
//     }
//   });
// });

var album = {};
var trackNumber = 0;
var currentlyPlaying = false;

var player = spotify.player;


io.on('connection', function(socket){
  player.on({
    endOfTrack: function(){
      console.log('track finished');
      trackNumber++;
      if(trackNumber <= album.tracks.length){
        console.log('trackNumber:', trackNumber);
        var track = spotify.createFromLink(album.tracks[trackNumber].track_link);
        player.play(track);
        socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber}); // send feedback
      } else {
        console.log('trackNumber fail:', trackNumber);
        socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber}); // send feedback
      }
    }
  });
  console.log('socket connected');
  socket.emit('socket connected');


  socket.on('examine album', function(data){
    console.log('examine album:', data.album.name);
      album = data.album;
      // console.log('this is the ablum:', album);
  });

  // command

  socket.on('command', function(data){
    console.log('command:', data);
    switch(data.cmd){
      case 'play':
        trackNumber = data.trackNumber;
        var track = spotify.createFromLink(album.tracks[trackNumber].track_link);
        player.play(track);
        currentlyPlaying = true;
        socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber}); // send feedback
        break;
      case 'pause':
        player.pause();
        currentlyPlaying = false;
        socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber}); // send feedback
        break;
    }
  });

  socket.on('get status', function(data){
    if(currentlyPlaying){
      socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber}); // send feedback
    } else {
      socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber}); // send feedback
    }
  });

  ////////////////////////////////////////////////////////////

  // socket.on('get album', function(data){
  //   console.log('get album');
  //   socket.emit('examining album', {album: album});
  // });
  //
  //
  //   // play track
  //   socket.on('play track', function(data){
  //     console.log('play track');
  //     album = data.album;
  //     var trackNumber = data.trackNumber;
  //     var track = spotify.createFromLink(album.tracks[trackNumber].track_link);
  //     player.play(track);
  //     socket.emit('track playing', track);
  //     player.on({
  //       endOfTrack: function(){
  //         io.emit('track finished');
  //         console.log('track finished.');
  //       }
  //     });
  //   });
  //
  // socket.on('stop track', function(data){
  //   player.stop();
  // });
  //
  // socket.on('pause track', function(data){
  //   player.pause();
  //   console.log('track paused');
  //   socket.emit('track paused');
  // });
});


module.exports = router;
