angular.module('simplifyApp', ['ngRoute']);

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

angular.module('simplifyApp').controller('IndexController',['$http', '$location', function($http, $location){
  var ic = this;

  // var socket = io();
  // socket.on('test', function(data){
  //   console.log('test server response:', data);
  //   socket.emit('client test',{object: 'client object'});
  // });

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

angular.module('simplifyApp').controller('ExamineController',['AlbumFactory', '$scope', function(AlbumFactory, $scope){
  var ec = this;

  ec.trackCount = 0;
  ec.currentlyPlaying = false;
  ec.coverView = false;

  // connected socket
  socket.on('socket connected', function(data){
    console.log('socket connected');
  });

  // get album

  socket.on('status', function(data){
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
        ec.currentAlbum = data.examineAlbum;
        ec.trackCount = data.trackNumber;
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
    socket.emit('command', {cmd: 'play', album: ec.currentAlbum, trackNumber: trackNumber});
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
    ec.playTrack(ec.trackCount);
  };

  ec.nextTrack = function(){
    ec.trackCount++;
    ec.playTrack(ec.trackCount);
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
    // socket.emit('', {album: album});
    //currentAlbum.album = album;
    console.log('examining album:', album);
    // $http.post('/spotify/album-features', album.tracks).then(function(response){
    //   console.log('album features response:', response.data);
    //   currentAlbum.album = album;
    //   //console.log('currentAlbum:', currentAlbum);
    //   currentAlbum.album.tracks = response.data;
    //   //console.log('currentAlbum2:', currentAlbum);
    // });
  };

  // var playAlbum = function(album){
  //   // $http.get('/play/album' + album.link).then(function(response){
  //   //   console.log('playing album.');
  //   // });
  //   var track = 0;
  //   var playTrack = function(){
  //     $http.post('/play/track/',  album.tracks[track]).then(function(response){
  //       console.log('track ended?', response.data);
  //       if(response.data.message === 'track playing'){
  //         console.log('playing:', album.tracks[track].track_name);
  //       } else if (response.data.message === 'track finished'){
  //         console.log('track ended.');
  //         playTrack();
  //       }
  //
  //     });
  //   };
  //   playTrack();
  // };



  return {
    currentAlbum: currentAlbum,
    examineAlbum: examineAlbum,
    updateAlbums: updateAlbums,
    albums: albums,
    getAlbums: getAlbums
    // playAlbum: playAlbum,
    // playTrack: playTrack
  }
}]);

angular.module('simplifyApp').factory('UserTrackFactory', ['$http', function($http){
  var user = {};

  var getUserInfo = function(){
    return $http.get('/authorize/info');
  }

  return {
    user: user,
    getUserInfo: getUserInfo
  }
}]);
//
