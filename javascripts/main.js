// --------------------------------------------------------------------------------------
// define angular module/app
var etlog = angular.module('etlog', ['ui.router', 'angularUtils.directives.dirPagination' ]);
// --------------------------------------------------------------------------------------
// set page title
// --------------------------------------------------------------------------------------
etlog.run(['$rootScope', function($rootScope) {
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    $rootScope.title = toState.title;   // set current state title
  });
}]);
// --------------------------------------------------------------------------------------
