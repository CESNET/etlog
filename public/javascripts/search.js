// --------------------------------------------------------------------------------------
// TODO
//$(document).ready(function(){
// --------------------------------------------------------------------------------------
  //$("#results")[0].style.visibility = "hidden"; // TODO

  // define angular module/app
  var etlog = angular.module('etlog', ['ngRoute']);

  etlog.config(function($routeProvider) {
    $routeProvider

    .when('/', {
      templateUrl : 'views/search',
      controller  : 'search_contoller'
    })

    // route for the about page
    .when('/search/mac', {
      templateUrl : 'views/mac',
      controller  : 'mac_controller'
    })


  });

  etlog.controller('search_contoller', ['$scope', '$http', function ($scope, $http) {
      // create a blank object to hold our form information
      // $scope will allow this to pass between controller and view
      $scope.formData = {};
      $scope.submit = function () {
        //alert("submit");
        $http({
          //method  : 'POST',
          method  : 'GET',
          url     : '/search',
          params    : $scope.formData,  // pass in data as strings
          //data    : $.param($scope.formData),  // pass in data as strings
          //headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })      // TODO
        .success(function(data) {
          console.log(data);

          //if (!data.success) {
          //  // if not successful, bind errors to error variables
          //  $scope.error_username = data.errors.username;
          //  $scope.error_mac_address = data.errors.mac_address;
          //} else {
          //  // if successful, bind success message to message
          //  $scope.message = data.message;
          //}
        });
      }
  }]);


  etlog.controller('mac_controller', ['$scope', '$http', function ($scope, $http) {
      // create a blank object to hold our form information
      // $scope will allow this to pass between controller and view
      //$scope.formData = {};
      //$scope.submit = function () {
      //  //alert("submit");
      //  $http({
      //    //method  : 'POST',
      //    method  : 'GET',
      //    url     : '/search',
      //    params    : $scope.formData,  // pass in data as strings
      //    //data    : $.param($scope.formData),  // pass in data as strings
      //    //headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
      //  })      // TODO
      //  .success(function(data) {
      //    console.log(data);

      //    //if (!data.success) {
      //    //  // if not successful, bind errors to error variables
      //    //  $scope.error_username = data.errors.username;
      //    //  $scope.error_mac_address = data.errors.mac_address;
      //    //} else {
      //    //  // if successful, bind success message to message
      //    //  $scope.message = data.message;
      //    //}
      //  });
      //}
  }]);

//})
// --------------------------------------------------------------------------------------
