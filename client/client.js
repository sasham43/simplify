angular.module('simplifyApp', ['ngRoute']);

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

  ic.checkLocation = function(){
    if($location.url() == '/'){
      ic.showNav = false;
    } else {
      ic.showNav = true;
    }
  };

  ic.checkLocation();

  console.log('Index controller loaded.', $location.url());
}]);

angular.module('simplifyApp').controller('SplashController',['$http', '$location', function($http, $location){
  // if($location.url() == '/')
  console.log('Splash controller loaded.', $location.url());
}]);

angular.module('simplifyApp').controller('AlbumsController',['UserTrackFactory', 'AlbumFactory', function(UserTrackFactory, AlbumFactory){
  var ac = this;
  console.log('albums here?', ac.albums);

  ac.user = {};
  ac.albums = AlbumFactory.albums;

  UserTrackFactory.getUserInfo().then(function(response){
    ac.user = response.data;
    console.log('User info:', ac.user);
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
    AlbumFactory.examineAlbum(album);
  };

  ac.getAlbums(ac.stopSpin);

  console.log('albums controller loaded.', ac.albums);
}]);

angular.module('simplifyApp').controller('ExamineController',['AlbumFactory', function(AlbumFactory){
  var ec = this;

  ec.currentAlbum = AlbumFactory.currentAlbum.album;

  // ec.trackStyles = {
  //   height: (600 / ec.currentAlbum.tracks.length) + 'px'
  // };

  // hover states
  ec.showAlbumOverlay = function(){
    ec.showOverlay = true;
  };
  ec.hideAlbumOverlay = function(){
    ec.showOverlay = false;
  };

  // analyze tracks
  ec.analyzeTrack = function(track){
    AlbumFactory.analyzeTrack(track);
  };

  // analyze whole album
  ec.analyzeAlbum = function(tracks){
    AlbumFactory.analyzeAlbum(tracks);
  };

  ec.playAlbum = function(album){
    AlbumFactory.playAlbum(album);
  };

  ec.playTrack = function(track){
    AlbumFactory.playTrack(track);
  };

  //AlbumFactory.analyzeAlbum(ec.currentAlbum.tracks);

  console.log('examine controller loaded.', ec.currentAlbum);
}]);


// factories

angular.module('simplifyApp').factory('AlbumFactory', ['$http', '$location', function($http, $location){
  var albums = [];
  var currentAlbum = {album:{}};
  var features = {features:{}};
  var albumFeatures = {};
  //var storedAlbums = [];

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
    $http.post('/spotify/album-features', album.tracks).then(function(response){
      console.log('album features response:', response.data);
      currentAlbum.album = album;
      //console.log('currentAlbum:', currentAlbum);
      currentAlbum.album.tracks = response.data;
      //console.log('currentAlbum2:', currentAlbum);
    });
  };

  var analyzeTrack = function(track){
    $http.get('/spotify/track-features/' + track.id).then(function(response){
      console.log('track feature response:', response.data);
      features.features = response.data;
    });
  };

  var analyzeAlbum = function(tracks){
    $http.post('/spotify/album-features', tracks).then(function(response){
      console.log('album features response:', response.data);
      albumFeatures.features = response.data;
    });
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
    analyzeTrack: analyzeTrack,
    features: features,
    analyzeAlbum: analyzeAlbum,
    albumFeatures: albumFeatures,
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
