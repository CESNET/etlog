// --------------------------------------------------------------------------------------
angular.module('etlog').factory('user_info_service', [ '$rootScope', '$http', function ($rootScope, $http) {
  function get_user_info() {
    if(!$rootScope.user) {
      return $http({
        method  : 'GET',
        url     : '/api/user/info'
      })
      .then(function(response) {
        $rootScope.user = response.data;
        return response.data;
      });
    }
  }

  return {
    get_user_info : get_user_info
  }
}]);
// --------------------------------------------------------------------------------------
angular.module('etlog').config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  $stateProvider

  .state('search', {
    url: '/search?pn&csi&visinst&realm',
    templateUrl: '/partials/search.html',
    title : 'etlog: obecné vyhledávání',
  })

  .state('mac_count', {
    url: '/mac_count',
    templateUrl: '/partials/mac_count.html',
    title : 'etlog: počet zařízení',
    allowed : [ 'realm_admin', 'admin' ]
  })

  .state('shared_mac', {
    url: '/shared_mac',
    templateUrl: '/partials/shared_mac.html',
    title : 'etlog: sdílená zařízení',
    allowed : [ 'realm_admin', 'admin' ]
  })

  .state('failed_logins', {
    url: '/failed_logins',
    templateUrl: '/partials/failed_logins.html',
    title : 'etlog: neúspěšná přihlášení',
    allowed : [ 'realm_admin', 'admin' ]
  })

  .state('heat_map', {
    url: '/heat_map',
    templateUrl: '/partials/heat_map.html',
    title : 'etlog: mapa roamingu',
  })

  .state('orgs_roaming_most_used', {
    url: '/orgs_roaming_most_used',
    templateUrl: '/partials/orgs_roaming_most_used.html',
    title : 'etlog: organizace nejvíce využívající roaming',
  })

  .state('orgs_roaming_most_provided', {
    url: '/orgs_roaming_most_provided',
    templateUrl: '/partials/orgs_roaming_most_provided.html',
    title : 'etlog: organizace nejvíce poskytující konektivitu',
  })

  .state('roaming_activity', {
    url: '/roaming_activity',
    templateUrl: '/partials/roaming_activity.html',
    title : 'etlog: aktivita CZ eduroamu',
  })

  .state('detection_data', {
    url: '/detection_data',
    templateUrl: '/partials/detection_data.html',
    title : 'etlog: absolutní počet přihlášení',
    allowed : [ 'admin' ]
  })

  .state('detection_data_grouped', {
    url: '/detection_data_grouped',
    templateUrl: '/partials/detection_data_grouped.html',
    title : 'etlog: normalizovaný počet přihlíšení',
    allowed : [ 'admin' ]
  })

  .state('concurrent_users', {
    url: '/concurrent_users?username&revision',
    templateUrl: '/partials/concurrent_users.html',
    title : 'etlog: uživatelé v různých lokalitách současně',
    allowed : [ 'realm_admin', 'admin' ]
  })

  .state('concurrent_inst', {
    url: '/concurrent_inst',
    templateUrl: '/partials/concurrent_inst.html',
    title : 'etlog: nejčastější souběžně vyskytující se instituce',
    allowed : [ 'realm_admin', 'admin' ]
  })

  .state('notifications', {
    url: '/notifications',
    templateUrl: '/partials/notifications.html',
    title : 'etlog: správa notifikací',
    allowed : [ 'realm_admin', 'admin' ]
  })

  .state('not_allowed', {
    url: '/not_allowed',
    templateUrl: '/partials/not_allowed.html',
    title : 'etlog',
  })
}]);
// --------------------------------------------------------------------------------------

