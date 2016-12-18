// --------------------------------------------------------------------------------------
angular.module('etlog').config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('search', {
    url: '/search?pn&csi',
    templateUrl: '/partials/search.html',
    title : 'etlog: obecné vyhledávání'
  })

  .state('mac_count', {
    url: '/mac_count',
    templateUrl: '/partials/mac_count.html',
    title : 'etlog: počet zařízení'
  })

  .state('shared_mac', {
    url: '/shared_mac',
    templateUrl: '/partials/shared_mac.html',
    title : 'etlog: sdílená zařízení'
  })

  .state('failed_logins', {
    url: '/failed_logins',
    templateUrl: '/partials/failed_logins.html',
    title : 'etlog: neúspěšná přihlášení'
  })

  .state('heat_map', {
    url: '/heat_map',
    templateUrl: '/partials/heat_map.html',
    title : 'etlog: mapa roamingu'
  })

  .state('orgs_roaming_most_used', {
    url: '/orgs_roaming_most_used',
    templateUrl: '/partials/orgs_roaming_most_used.html',
    title : 'etlog: organizace nejvíce využívající roaming'
  })

  .state('orgs_roaming_most_provided', {
    url: '/orgs_roaming_most_provided',
    templateUrl: '/partials/orgs_roaming_most_provided.html',
    title : 'etlog: organizace nejvíce poskytující konektivitu'
  })

  .state('roaming_activity', {
    url: '/roaming_activity',
    templateUrl: '/partials/roaming_activity.html',
    title : 'etlog: aktivita CZ eduroamu'
  })

  .state('detection_data', {
    url: '/detection_data',
    templateUrl: '/partials/detection_data.html',
    title : 'etlog: absolutní počet přihlášení'
  })

  .state('detection_data_grouped', {
    url: '/detection_data_grouped',
    templateUrl: '/partials/detection_data_grouped.html',
    title : 'etlog: normalizovaný počet přihlíšení'
  })

  .state('concurrent_users', {
    url: '/concurrent_users',
    templateUrl: '/partials/concurrent_users.html',
    title : 'etlog: uživatelé v různých lokalitách současně'
  })

  .state('concurrent_inst', {
    url: '/concurrent_inst',
    templateUrl: '/partials/concurrent_inst.html',
    title : 'etlog: nejčastější souběžně vyskytující se instituce'
  })
});
// --------------------------------------------------------------------------------------
