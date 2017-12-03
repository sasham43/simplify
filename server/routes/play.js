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

var album = {};
var examineAlbum = {};
var trackNumber = 0;
var currentlyPlaying = false;

var player = spotify.player;


io.on('connection', function(socket){
  player.on({
    endOfTrack: function(){
      console.log('track finished');
      trackNumber++;
      if(trackNumber < album.tracks.length){
        console.log('trackNumber:', trackNumber);
        var track = spotify.createFromLink(album.tracks[trackNumber].track_link);
        player.play(track);
        socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
      } else {
        console.log('album ended:', trackNumber);
        socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
      }
    }
  });
  console.log('socket connected');
  socket.emit('socket connected');


  socket.on('examine album', function(data){
    examineAlbum = data.album;
    console.log('examine album:', album, examineAlbum);
      //album = data.album;
      // console.log('this is the ablum:', album);
  });

  // command

  socket.on('command', function(data){
    album = examineAlbum;

    console.log('command:', data, album, examineAlbum);
    switch(data.cmd){
      case 'play':
        if(player.currentSecond != 0 && trackNumber == data.trackNumber){
          player.resume();
          socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
        } else {
          trackNumber = data.trackNumber;
          var track = spotify.createFromLink(album.tracks[trackNumber].track_link);
          player.play(track);
          currentlyPlaying = true;
          socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
        }
        break;
      case 'pause':
        player.pause();
        currentlyPlaying = false;
        socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
        break;
    }
  });

  socket.on('get status', function(data){
    if(currentlyPlaying){
      socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
    } else {
      socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
    }
  });

  // socket.on('disconnect', function(){
  //   //console.log('disconnected, attempting to reconnect.');
  //   //socket.emit('disconnect');
  //   // socket.reconnect();
  // });
});


module.exports = router;
