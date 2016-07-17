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

  UserTrackFactory.getUserInfo().then(function(response){
    hc.user = response.data;
    console.log('User info:', hc.user);
  });

  // start spin
  hc.spinning = true;

  if(!hc.albums){
    AlbumFactory.getAlbums().then(function(response){
      console.log('Album response:', response.data);
      hc.albums = response.data.albums;
      hc.spinning = false;
    });
  }


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

  console.log('home controller loaded.');
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

  console.log('examine controller loaded.');
}]);


// factories

angular.module('simplifyApp').factory('AlbumFactory', ['$http', '$location', function($http, $location){
  var albums = [];
  var currentAlbum = {album:{}};

  var getAlbums = function(){
    return $http.get('/spotify/albums');
  };

  var examineAlbum = function(album){
    $location.url('/album');
    currentAlbum.album = album;
  };

  return {
    currentAlbum: currentAlbum,
    examineAlbum: examineAlbum,
    getAlbums: getAlbums
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
