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

  .state('failed_logins', {
    url: '/failed_logins',
    templateUrl: '/partials/failed_logins.html',
    title : 'etlog: neúspěšná přihlášení'
  })

  .state('shared_mac', {
    url: '/shared_mac',
    templateUrl: '/partials/shared_mac.html',
    title : 'etlog: sdílená zařízení'
  })

  .state('graph_test_2', {
    url: '/graph_test_2',
    templateUrl: '/partials/graph_test_2.html',
    title : 'etlog: graph test 2'
  })

  .state('graph_test_3', {
    url: '/graph_test_3',
    templateUrl: '/partials/graph_test_3.html',
    title : 'etlog: graph test 3'
  })

  .state('roaming_most_provided', {
    url: '/roaming_most_provided',
    templateUrl: '/partials/roaming_most_provided.html',
    title : 'etlog: posktovaný roaming - vyhledávání'
  })

  .state('roaming_most_used', {
    url: '/roaming_most_used',
    templateUrl: '/partials/roaming_most_used.html',
    title : 'etlog: čerpaný roaming - vyhledávání'
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

  .state('test', {
    url: '/test',
    templateUrl: '/partials/test.html',
    title : 'etlog: test datepickeru'
  })

  .state('detection_data', {
    url: '/detection_data',
    templateUrl: '/partials/detection_data.html',
    title : 'etlog: data k detekci 1'
  })

  .state('detection_data_grouped', {
    url: '/detection_data_grouped',
    templateUrl: '/partials/detection_data_grouped.html',
    title : 'etlog: data k detekci 2'
  })
});
// --------------------------------------------------------------------------------------
