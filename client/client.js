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

  hc.user = {};

  UserTrackFactory.getUserInfo().then(function(response){
    hc.user = response.data;
    console.log('User info:', hc.user);
  });

  AlbumFactory.getAlbums();

  console.log('home controller loaded.');
}]);

angular.module('simplifyApp').controller('LoginController',['$http', function($http){
  var lc = this;
  console.log('Login controller loaded.');
}]);

angular.module('simplifyApp').controller('AboutController',['$http', function($http){
  console.log('About controller loaded.');
}]);


// factories

angular.module('simplifyApp').factory('AlbumFactory', ['$http', function($http){
  var albums = [];

  var getAlbums = function(){
    $http.get('/spotify/albums').then(function(response){
      console.log('Album response:', response.data);
    });
  };

  return {
    albums: albums,
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
