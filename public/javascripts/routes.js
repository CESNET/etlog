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
    title : 'etlog: nejvíce poskytovaný roaming'
  })

  .state('roaming_most_used', {
    url: '/roaming_most_used',
    templateUrl: '/partials/roaming_most_used.html',
    title : 'etlog: nejvíce využívaný roaming'
  })

  .state('roaming_most_used_test', {
    url: '/roaming_most_used_test',
    templateUrl: '/partials/roaming_most_used_test.html',
    title : 'etlog: roaming test 1'
  })

  .state('roaming_most_provided_test', {
    url: '/roaming_most_provided_test',
    templateUrl: '/partials/roaming_most_provided_test.html',
    title : 'etlog: roaming test 2'
  })

  .state('roaming_activity', {
    url: '/roaming_activity',
    templateUrl: '/partials/roaming_activity.html',
    title : 'etlog: aktivita eduroamu'
  })

  .state('test', {
    url: '/test',
    templateUrl: '/partials/test.html',
    title : 'etlog: test datepickeru'
  })

  .state('detection_data', {
    url: '/detection_data',
    templateUrl: '/partials/detection_data.html',
    title : 'etlog: data k detekci'
  })
});
// --------------------------------------------------------------------------------------
