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

    $locationProvider.html5Mode(true);
}]);

angular.module('simplifyApp').controller('SplashController',['$http', function($http){
  console.log('Splash controller loaded.');
}]);

angular.module('simplifyApp').controller('LoginController',['$http', function($http){
  console.log('Login controller loaded.');
}]);

angular.module('simplifyApp').controller('AboutController',['$http', function($http){
  console.log('About controller loaded.');
}]);
