// --------------------------------------------------------------------------------------
angular.module('etlog').config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('search', {
    url: '/search',
    templateUrl: '/partials/search.html',
    params: {
      pn : null,
      csi: null
    }
  })

  .state('mac_count', {
    url: '/mac_count',
    templateUrl: '/partials/mac_count.html'
  })

  .state('failed_logins', {
    url: '/failed_logins',
    templateUrl: '/partials/failed_logins.html'
  })

  .state('shared_mac', {
    url: '/shared_mac',
    templateUrl: '/partials/shared_mac.html'
  })

  .state('roaming_most_provided', {
    url: '/roaming_most_provided',
    templateUrl: '/partials/roaming_most_provided.html'
  })

  .state('roaming_most_used', {
    url: '/roaming_most_used',
    templateUrl: '/partials/roaming_most_used.html'
  })

  .state('roaming_most_used_test', {
    url: '/roaming_most_used_test',
    templateUrl: '/partials/roaming_most_used_test.html'
  })

  .state('roaming_most_provided_test', {
    url: '/roaming_most_provided_test',
    templateUrl: '/partials/roaming_most_provided_test.html'
  })

  .state('roaming_activity', {
    url: '/roaming_activity',
    templateUrl: '/partials/roaming_activity.html'
  })
});
// --------------------------------------------------------------------------------------
