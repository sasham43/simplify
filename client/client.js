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

  // start spin
//  hc.spinning = true;

  // if(hc.albums.length <= 0){
  //   AlbumFactory.updateAlbums();
  // }

  ac.getAlbums = function(){
    ac.spinning = true;
    AlbumFactory.getAlbums(ac.stopSpin);
  };

  ac.stopSpin = function(){
    ac.spinning = false;
    $location.hash('album79');
    console.log('spin spotted');
  };

  ac.updateAlbums = function(){
    ac.spinning = true; // start spin
    AlbumFactory.updateAlbums(ac.stopSpin);
  };


  // hover states
  ac.showAlbumOverlay = function(album){
    album.show = true;
  };
  ac.hideAlbumOverlay = function(album){
    album.show = false;
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

  //ec.currentAlbum = AlbumFactory.currentAlbum.album;
  ec.trackCount = 0;
  ec.currentlyPlaying = false;

  // connected socket
  socket.on('socket connected', function(data){
    console.log('socket connected');
  });

  // get album
  socket.emit('get album');

  // receive album
  socket.on('examining album', function(data){
    $scope.$apply(function(){
      ec.currentAlbum = data.album;
    });
    console.log('examining album', ec.currentAlbum);
  });

  // track playing
  socket.on('track playing', function(data){
    console.log('playing track:', data.name);
    $scope.$apply(function(){
      ec.currentlyPlaying = true;
    });
    // ec.currentlyPlaying = true;
    console.log('ec.currentlyPlaying', ec.currentlyPlaying);
  });

  // track paused
  socket.on('track paused', function(data){
    $scope.$apply(function(){
      ec.currentlyPlaying = false;
    });
    console.log('track paused', ec.currentlyPlaying);
  });

  // track finished
  socket.on('track finished', function(data){
    console.log('track finished');
    $scope.$apply(function(){
      ec.trackCount++;
    });

    if(ec.trackCount <= ec.currentAlbum.tracks.length - 1){
      ec.playPauseTrack(ec.trackCount);
      //ec.trackHighlight(ec.trackCount);
    } else {
      socket.emit('stop track');
      //ec.trackMarker(0);
    }
  });

  ec.playTrack = function(trackNumber){
    socket.emit('play track', {album: ec.currentAlbum, trackNumber: trackNumber});
    // $scope.$apply(function(){
      ec.trackCount = trackNumber;
    // })
  };

  ec.pauseTrack = function(){
    socket.emit('pause track');
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
    currentAlbum.album = album;
    console.log('examining album:', album);
    // $http.post('/spotify/album-features', album.tracks).then(function(response){
    //   console.log('album features response:', response.data);
    //   currentAlbum.album = album;
    //   //console.log('currentAlbum:', currentAlbum);
    //   currentAlbum.album.tracks = response.data;
    //   //console.log('currentAlbum2:', currentAlbum);
    // });
  };

  var playAlbum = function(album){
    // $http.get('/play/album' + album.link).then(function(response){
    //   console.log('playing album.');
    // });
    var track = 0;
    var playTrack = function(){
      $http.post('/play/track/',  album.tracks[track]).then(function(response){
        console.log('track ended?', response.data);
        if(response.data.message === 'track playing'){
          console.log('playing:', album.tracks[track].track_name);
        } else if (response.data.message === 'track finished'){
          console.log('track ended.');
          playTrack();
        }

      });
    };
    playTrack();
  };

  var playTrack = function(track){
    $http.get('/play/track/' + track.track_link).then(function(response){

    });
  };



  return {
    currentAlbum: currentAlbum,
    examineAlbum: examineAlbum,
    updateAlbums: updateAlbums,
    albums: albums,
    getAlbums: getAlbums,
    playAlbum: playAlbum,
    playTrack: playTrack
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
