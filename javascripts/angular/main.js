// --------------------------------------------------------------------------------------
// define angular module/app
angular.module('etlog', ['ui.router', 'angularUtils.directives.dirPagination' ]);
// --------------------------------------------------------------------------------------
// set page title
// --------------------------------------------------------------------------------------
angular.module('etlog').run(['$rootScope', '$http', '$state', function($rootScope, $http, $state) {
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    $rootScope.title = toState.title;   // set current state title
  });
  get_user_info($rootScope, $http);
  check_state_permissions($rootScope, $state, $http);
}]);
// --------------------------------------------------------------------------------------
// check the user has correct permissions to enter desired state
// --------------------------------------------------------------------------------------
function check_state_permissions($rootScope, $state, $http)
{
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    get_permissions($http, function(data) {
      var highest = data[data.length - 1];  // highest available privilege

      if(toState.allowed && toState.allowed.indexOf(highest) == -1) {
        event.preventDefault();

        if(!fromState.name)     // no previous state
          $state.go('search');  // "default" state
        else
          $state.go(fromState.name);    // go to previous state
      }
    });
  });
}
// --------------------------------------------------------------------------------------
// get user permissions from backend
// --------------------------------------------------------------------------------------
function get_permissions($http, callback)
{
  $http({
    method  : 'GET',
    url     : '/api/user/permissions'
  })
    .then(function(response) {
      callback(response.data);
  });
}
// --------------------------------------------------------------------------------------
// get basic user info
// --------------------------------------------------------------------------------------
function get_user_info($rootScope, $http)
{
  if(!$rootScope.user) {
    $http({
      method  : 'GET',
      url     : '/api/user/info'
    })
    .then(function(response) {
      $rootScope.user = response.data;
    });
  }
}
// --------------------------------------------------------------------------------------
// http interceptor to solve expired shibboleth sessions
// --------------------------------------------------------------------------------------
angular.module('etlog').factory('expired_sessions_interceptor', function($q, $window) {
  return {
   // XMLHttpRequest cannot load https://ds.eduid.cz/wayf.php?filter=..... No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'https://etlog-dev.cesnet.cz' is therefore not allowed access.
   // not a clean solution for reauthenticating the user if the SP session expires but it works
   'responseError': function(rejection) {
      $window.location.reload();    // reaload the page to force the reauthentication on idp
      return $q.reject(rejection);
    }
  };
});
// --------------------------------------------------------------------------------------
angular.module('etlog').config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('expired_sessions_interceptor');
}]);
// --------------------------------------------------------------------------------------
