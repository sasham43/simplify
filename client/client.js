angular.module('simplifyApp', ['ngRoute']);

angular.module('simplifyApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  // fill in route info
  $routeProvider
    .when('/',{
      templateUrl: '/views/splash.html',
      controller: 'SplashController',
      controllerAs: 'sc'
    })
    .when('/about', {
      templateUrl: '/views/about.html',
      controller: 'AboutController',
      controllerAs: 'ac'
    })
    .when('/login', {
      templateUrl: '/views/login.html',
      controller: 'LoginController',
      controllerAs: 'lc'
    })
    .when('/home', {
      templateUrl: '/views/home.html',
      controller: 'HomeController',
      controllerAs: 'hc'
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

angular.module('simplifyApp').controller('SplashController',['$http', function($http){
  console.log('Splash controller loaded.');
}]);

angular.module('simplifyApp').controller('HomeController',['UserTrackFactory', 'AlbumFactory', function(UserTrackFactory, AlbumFactory){
  var hc = this;
  console.log('albums here?', hc.albums);

  hc.user = {};
  hc.albums = AlbumFactory.albums;

  UserTrackFactory.getUserInfo().then(function(response){
    hc.user = response.data;
    console.log('User info:', hc.user);
  });

  // start spin
//  hc.spinning = true;

  // if(hc.albums.length <= 0){
  //   AlbumFactory.updateAlbums();
  // }

  hc.stopSpin = function(){
    hc.spinning = false;
  };

  hc.updateAlbums = function(){
    hc.spinning = true; // start spin
    AlbumFactory.updateAlbums(hc.stopSpin);
  };


  // hover states
  hc.showAlbumOverlay = function(album){
    album.show = true;
  };
  hc.hideAlbumOverlay = function(album){
    album.show = false;
  };

  // examine album
  hc.examineAlbum = function(album){
    AlbumFactory.examineAlbum(album);
  };

  console.log('home controller loaded.', hc.albums);
}]);

angular.module('simplifyApp').controller('ExamineController',['AlbumFactory', function(AlbumFactory){
  var ec = this;

  ec.currentAlbum = AlbumFactory.currentAlbum.album.album;

  ec.trackStyles = {
    height: (600 / ec.currentAlbum.tracks.items.length) + 'px'
  };

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

  //AlbumFactory.analyzeAlbum(ec.currentAlbum.tracks);

  console.log('examine controller loaded.', ec.currentAlbum);
}]);


// factories

angular.module('simplifyApp').factory('AlbumFactory', ['$http', '$location', function($http, $location){
  var albums = [];
  var currentAlbum = {album:{}};
  var features = {features:{}};
  var albumFeatures = {};

  var updateAlbums = function(stopSpin){
    $http.get('/spotify/albums/update').then(function(response){
      console.log('Album response:', response.data);
      angular.copy(response.data.albums, albums);
      //updateStatus = {response: response.data};
      stopSpin();
    });;
  };

  var examineAlbum = function(album){
    $location.url('/album');
    currentAlbum.album = album;
    console.log('examining album:', album);
    $http.post('/spotify/album-features', album.album.tracks).then(function(response){
      console.log('album features response:', response.data);
      currentAlbum.album = album;
      console.log('currentAlbum:', currentAlbum);
      currentAlbum.album.album.tracks = response.data;
      console.log('currentAlbum2:', currentAlbum);
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

  return {
    currentAlbum: currentAlbum,
    examineAlbum: examineAlbum,
    updateAlbums: updateAlbums,
    albums: albums,
    analyzeTrack: analyzeTrack,
    features: features,
    analyzeAlbum: analyzeAlbum,
    albumFeatures: albumFeatures
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
