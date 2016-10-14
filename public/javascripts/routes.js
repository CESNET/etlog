// --------------------------------------------------------------------------------------
angular.module('etlog').config(function($routeProvider) {
  $routeProvider

  .when('/search', {
    templateUrl : '/partials/search.html',
    controller  : 'search_contoller'
  })

  .when('/mac_count', {
    templateUrl : '/partials/mac_count.html',
    controller  : 'mac_controller'
  })

  .when('/failed_logins', {
    templateUrl : '/partials/failed_logins.html',
    controller  : 'failed_logins_controller'
  })

  .when('/roaming_most_provided', {
    templateUrl : '/partials/roaming_most_provided.html',
    controller  : 'roaming_most_provided_controller'
  })

  .when('/roaming_most_used', {
    templateUrl : '/partials/roaming_most_used.html',
    controller  : 'roaming_most_used_controller'
  })
});
// --------------------------------------------------------------------------------------
