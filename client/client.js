angular.module('simplifyApp', ['ngRoute', 'ngAnimate']);

var socket = io();

angular.module('simplifyApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  // fill in route info
  $routeProvider
    .when('/',{
      templateUrl: '/views/splash.html',
      controller: 'SplashController',
      controllerAs: 'sc'
    })
    .when('/login', {
      templateUrl: '/views/login.html',
      controller: 'LoginController',
      controllerAs: 'lc'
    })
    .when('/albums', {
      templateUrl: '/views/albums.html',
      controller: 'AlbumsController',
      controllerAs: 'ac'
    })
    .when('/album', {
      templateUrl: '/views/album.html',
      controller: 'ExamineController',
      controllerAs: 'ec'
    })
    // .otherwise({
    //   redirectTo: '/login'
    // });

    $locationProvider.html5Mode(true);
}]);

angular.module('simplifyApp').service('DeviceService', function(){
    return {
        device_id: null
    }
});

angular.module('simplifyApp').controller('IndexController',['$http', '$location', '$rootScope', 'DeviceService', function($http, $location, $rootScope, DeviceService){
  var ic = this;
  var that;

  ic.load_spotify = true;

  // var socket = io();
  // socket.on('test', function(data){
  //   console.log('test server response:', data);
  //   socket.emit('client test',{object: 'client object'});
  // });
  window.onSpotifyPlayerAPIReady = function() {

    $http.get('/spotify/info').then(function(data){
      console.log('spotify info:', data)
      const token = data.data.token;
      const player = new Spotify.Player({
        name: 'simplify',
        getOAuthToken: function(cb){ cb(token); }
      });

      // errors
      player.on('initialization_error', function (e) {
          console.error("Failed to initialize", e.message);
        });
        player.on('authentication_error', function (e) {
          console.error("Failed to authenticate", e.message);
        });
        player.on('account_error', function (e) {
          console.error("Failed to validate Spotify account", e.message);
        });
        player.on('playback_error', function (e) {
          console.error("Failed to perform playback", e.message);
        });

      // Ready
      player.on('ready', function(data){
        console.log('ready with device id:', data);
        DeviceService.device_id = data.device_id;

          socket.emit('device', data);
      });

      player.togglePlay();

      // Connect to the player!
      player.connect().then(function(success){
          console.log('success:', success);
      }).catch(function(err){
          console.log('no success:', err);
      });
    });


  }

  ic.checkLocation = function(){
    if($location.url() == '/'){
      ic.showNav = false;
    } else {
      ic.showNav = true;
    }
  };

  ic.checkLocation();

  // console.log('Index controller loaded.', $location.url());
}]);

angular.module('simplifyApp').controller('SplashController',['$http', '$location', function($http, $location){
  // if($location.url() == '/')
  console.log('Splash controller loaded.', $location.url());
}]);

angular.module('simplifyApp').controller('AlbumsController',['UserTrackFactory', 'AlbumFactory', '$location', function(UserTrackFactory, AlbumFactory, $location){
  var ac = this;
  // console.log('albums here?', ac.albums);

  ac.user = {};
  ac.albums = AlbumFactory.albums;

  UserTrackFactory.getUserInfo().then(function(response){
    ac.user = response.data;
    // console.log('User info:', ac.user);
  });

  ac.getAlbums = function(){
    ac.spinning = true;
    AlbumFactory.getAlbums(ac.stopSpin);
  };

  ac.stopSpin = function(){
    ac.spinning = false;
    // $location.hash('album79');
    // console.log('spin spotted');
  };

  ac.updateAlbums = function(){
    ac.spinning = true; // start spin
    AlbumFactory.updateAlbums(ac.stopSpin);
  };

  // examine album
  ac.examineAlbum = function(album){
    socket.emit('examine album', {album: album});
    AlbumFactory.examineAlbum(album);
  };

  ac.getAlbums(ac.stopSpin);

  console.log('albums controller loaded.');
}]);

angular.module('simplifyApp').controller('ExamineController',['AlbumFactory', 'UserTrackFactory', 'DeviceService', '$http', '$scope', function(AlbumFactory, UserTrackFactory, DeviceService, $http, $scope){
  var ec = this;

  ec.trackCount = 0;
  ec.currentlyPlaying = false;
  ec.coverView = false;

  // connected socket
  socket.on('socket connected', function(data){
    console.log('socket connected');
  });

  socket.on('disconnect', function(data){
    console.log('socket disconnected, attempting reconnect...');
    socket.connect();
  });

  // get album

  socket.on('status', function(data){
    // console.log('status:', data)
    if(data.examineAlbum.album_id == data.album.album_id){
      switch (data.status){
        case 'track playing':
          $scope.$apply(function(){
            ec.currentlyPlaying = true;
          });
          break;
        case 'track paused':
          $scope.$apply(function(){
            ec.currentlyPlaying = false;
          });
          break;
      }
      $scope.$apply(function(){
        // ec.currentAlbum = data.examineAlbum;
        // ec.trackCount = data.trackNumber;
        ec.currentAlbum = data.examineAlbum;
        ec.trackCount = data.track.track_number;
      });
    } else {
      $scope.$apply(function(){
        ec.trackCount = 0;
        ec.currentlyPlaying = false;
        ec.currentAlbum = data.examineAlbum;
      });
    }

    console.log('status: ', data, ec.currentAlbum);
  });


  socket.emit('get status');

  // commands

  ec.playTrack = function(trackNumber){
      console.log('device:', DeviceService)
    socket.emit('command', {cmd: 'play', album: ec.currentAlbum, trackNumber: trackNumber, device: DeviceService.device_id});
    //ec.trackCount = trackNumber;
  };

  ec.pauseTrack = function(){
    socket.emit('command', {cmd: 'pause'});
  };

  ec.playPauseTrack = function(trackNumber){
      if(ec.currentlyPlaying){
        ec.pauseTrack();
      } else {
        ec.playTrack(trackNumber);
      }
  };

  ec.prevTrack = function(){
    ec.trackCount--;
    // ec.playTrack(ec.trackCount);
    socket.emit('command', {cmd: 'prev'});
  };

  ec.nextTrack = function(){
    ec.trackCount++;
    // ec.playTrack(ec.trackCount);
    socket.emit('command', {cmd: 'next'});
  };

  ec.trackMarker = function(index){
    // console.log(index, trackNumber);
    if(index == ec.trackCount){
      return true;
    } else {
      return false;
    }
  };

  ec.switchView = function(){
    ec.coverView = !ec.coverView;
  };

  // console.log('examine controller loaded.', ec.currentAlbum);
}]);


// factories

angular.module('simplifyApp').factory('AlbumFactory', ['$http', '$location', function($http, $location){
  var albums = [];
  var currentAlbum = {album:{}};

  var getAlbums = function(stopSpin){
    $http.get('/spotify/albums/stored').then(function(response){
      console.log('Stored album response:', response.data, stopSpin);
      angular.copy(response.data.storedAlbums, albums);
      stopSpin();
    });
  };

  var updateAlbums = function(stopSpin){
    $http.get('/spotify/albums/update').then(function(response){
      console.log('Album response:', response.data, stopSpin);
      getAlbums(stopSpin);
      //angular.copy(response.data.albums, albums);
      //updateStatus = {response: response.data};
      //stopSpin();
    });;
  };

  var examineAlbum = function(album){
    $location.url('/album');
    console.log('examining album:', album);
  };



  return {
    currentAlbum: currentAlbum,
    examineAlbum: examineAlbum,
    updateAlbums: updateAlbums,
    albums: albums,
    getAlbums: getAlbums
  }
}]);

angular.module('simplifyApp').factory('UserTrackFactory', ['$http', function($http){
  var user = {};

  var getUserInfo = function(){
    console.log('here')
    return $http.get('/authorize/info');
  }

  return {
    user: user,
    getUserInfo: getUserInfo
  }
}]);
//
