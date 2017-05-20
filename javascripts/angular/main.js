// --------------------------------------------------------------------------------------
// define angular module/app
var etlog = angular.module('etlog', ['ui.router', 'angularUtils.directives.dirPagination' ]);
// --------------------------------------------------------------------------------------
// set page title
// --------------------------------------------------------------------------------------
etlog.run(['$rootScope', '$http', function($rootScope, $http) {
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    $rootScope.title = toState.title;   // set current state title
  });
  get_user_info($rootScope, $http);
}]);
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
