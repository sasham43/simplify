var router = require('express').Router();
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;
var request = require('request');
var authorize = require('./authorize');

var ready = function(){
  console.log('spotify play loaded.');
};

var album = {};
var examineAlbum = {};
var trackNumber = 0;
var currentlyPlaying = false;
var device_id;

io.on('connection', function(socket){
  // player.on({
  //   endOfTrack: function(){
  //     console.log('track finished');
  //     trackNumber++;
  //     if(trackNumber < album.tracks.length){
  //       console.log('trackNumber:', trackNumber);
  //       // var track = spotify.createFromLink(album.tracks[trackNumber].track_link);
  //       // player.play(track);
  //       socket.emit('status', {status: 'track playing', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
  //     } else {
  //       console.log('album ended:', trackNumber);
  //       socket.emit('status', {status: 'track paused', album: album, trackNumber: trackNumber, examineAlbum: examineAlbum}); // send feedback
  //     }
  //   }
  // });
  console.log('socket connected');
  socket.emit('socket connected');

  // socket.on('device', function(data){
  //     console.log('device:', data);
  //
  //     var options = {
  //         uri: 'https://api.spotify.com/v1/me/player',
  //         method: 'put',
  //         headers: {'Authorization': 'Bearer ' + authorize.access_token},
  //         json: {
  //             device_ids: [
  //                 data.device_id
  //             ],
  //             play: false
  //         }
  //     }
  //
  //     request(options, function(err, response, body){
  //         if(err)
  //           console.log('err', err);
  //
  //         console.log('device body', body)
  //     });
  // })

  socket.on('examine album', function(data){
    examineAlbum = data.album;
    // console.log('examine album:', album, examineAlbum);
    console.log('examine album');
      //album = data.album;
      // console.log('this is the ablum:', album);
      getStatus();
  });

  // command

  socket.on('command', function(data){
    // album = examineAlbum;

    console.log('command:', data);
    sendCommand(data, 0);
  });

  socket.on('get status', function(data){
    getStatus();
  });

  function getStatus(){
    var options = {
      url: 'https://api.spotify.com/v1/me/player/',
      headers: {'Authorization': 'Bearer ' + authorize.access_token},
      json: true
    };

    request.get(options, function(err, response, body){
      if(err)
        console.log('err', err);

      var playing = '';
      var track = {};
      if(body){
          console.log('status body:', body.is_playing, body.item.album.name, body.item.track_number)
      }
      if(body && body.is_playing && album.id == examineAlbum.id){
        playing = 'track playing';
      } else {
        playing = 'track paused';
      }
      if(body && body.item){
          track = body.item;
          trackNumber = body.item.track_number;
      }

      socket.emit('status', {status: playing, album: album, trackNumber: trackNumber, examineAlbum: examineAlbum, track: track});
    });
  }

  function sendCommand(data, i){
      var options = {
        headers: {'Authorization': 'Bearer ' + authorize.access_token},
        json: true
      };

      if(data.cmd == 'play'){
        options.url = 'https://api.spotify.com/v1/me/player/play';
        options.method = 'put';
        console.log('ids:', data.album.album_id, album.album_id)
        if((data.album.album_id != album.album_id) || trackNumber != data.trackNumber){
            // console.log('new')
            if(data.album.tracks.length && data.album.tracks[data.trackNumber]){
                options.json = {
                    uris: [
                        data.album.tracks[data.trackNumber].track_link
                    ]
                }
                console.log('track:', data.album.tracks[data.trackNumber].track_link)
            }
        }
      } else if (data.cmd == 'pause'){
        options.url = 'https://api.spotify.com/v1/me/player/pause';
        options.method = 'put';
      } else if (data.cmd == 'next') {
        options.url = 'https://api.spotify.com/v1/me/player/next';
        options.method = 'post';
      } else if (data.cmd == 'prev'){
        options.url = 'https://api.spotify.com/v1/me/player/previous';
        options.method = 'post';
      }

      request(options, function(err, response, body){
        if(err)
          console.log('err', err)

        console.log('cmd body:', response.statusCode);
        if(response.statusCode == 202 && i < 5){
            setTimeout(function(){
                i++
                console.log('retrying', i);
                sendCommand(data, i);
            }, 5000);
            // sendCommand(data, i++);
        } else {
            album = examineAlbum; // we made a command based on this album so it is playing now

            setTimeout(getStatus, 1000);
        }

        // getStatus();
      });
  }
});


module.exports = router;
