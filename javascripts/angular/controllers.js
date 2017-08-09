// --------------------------------------------------------------------------------------
// header controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('header_controller', ['$scope', '$http', '$location', '$rootScope', function ($scope, $http, $location, $rootScope) {
  $scope.is_active = function(navbar_path) {
    for(var item in navbar_path) {      // iterate array of acceptable values
      if(navbar_path[item] === $location.path())
        return true;        // return true if matches
    }

    return false;   // return false if not
  }

  setup_user_roles($rootScope, $scope, $http);
}]);
// --------------------------------------------------------------------------------------
// get basic info about the user
// setup user roles
// --------------------------------------------------------------------------------------
function setup_user_roles($rootScope, $scope, $http)
{
  $scope.change_role = function(role) {
    $http({
      method  : 'PUT',
      url     : '/api/user/set_role/' + role
    })
    .then(function(response) {
      $rootScope.user = response.data;
    });
  }
}
// --------------------------------------------------------------------------------------
// watch rooscope user variable for changes
// TODO - array of functions as third param to be generic?
// --------------------------------------------------------------------------------------
function watch_user($scope, $rootScope, $stateParams)
{
  $rootScope.$watch('user.role', function(new_val, old_val) {
    if(new_val === old_val) // no change
      return;

    form_set_role($scope, $rootScope);
    set_params($scope, $stateParams); // set params passed from other views
                                      // needed because user role can unset pn
  });
}
// --------------------------------------------------------------------------------------
// setup form to correspond to user role
// --------------------------------------------------------------------------------------
function form_set_role($scope, $rootScope)
{
  $scope.user = $rootScope.user;

  switch($scope.user.role) {
    case "user":
      $scope.form_data.pn = $scope.user.identities[0];  // set first identity
      break;

    case "realm_admin":
      $scope.form_data.pn = ""; // clear
      break;

    case "admin":
      $scope.form_data.pn = ""; // clear
      break;
  }
}
// --------------------------------------------------------------------------------------
// search controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('search_controller', ['$scope', '$http', '$stateParams', '$rootScope', function ($scope, $http, $stateParams, $rootScope) {
  init_search($scope, $http);
  watch_user($scope, $rootScope, $stateParams);
  $scope.paging = {
    items_by_page : $scope.user.items_by_page || 10,
    current_page : 1,
    filters : {         // must match route qs names
    },
    loading : false,
    total_items : 0
  };
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_search_submit($scope, $http, get_logs, $scope.paging, "logs");
  handle_pagination($scope, $http, $rootScope, get_logs);
  setup_filters($scope, $http, "logs");
  handle_sort_search($scope, $http, get_logs);
  set_params($scope, $stateParams); // set params passed from other views
  handle_download($scope, $http, ["result", "timestamp", "username", "mac_address", "realm", "visinst"]);
  handle_empty_form($scope);
  popover();
}]);
// --------------------------------------------------------------------------------------
// display popovers
// --------------------------------------------------------------------------------------
function popover()
{
  $(document).ready(function(){
    $('[data-toggle="popover"]').popover({ trigger: "hover" });
  });
}
// --------------------------------------------------------------------------------------
// checks if form is empty or not
// --------------------------------------------------------------------------------------
function handle_empty_form($scope)
{
  $scope.check_empty = function() {
    var items = [ "pn", "csi", "realm", "visinst", "result" ];    // form fields

    for(var item in items)
      if(items[item] in $scope.form_data && $scope.form_data[items[item]]) {    // is present and is not undefined
        $scope.empty = false;
        return true;
      }

    $scope.empty = true;
    return false;
  };
}
// --------------------------------------------------------------------------------------
// inittialize search variables
// --------------------------------------------------------------------------------------
function init_search($scope, $http)
{
  $scope.submitted = false; // form has not been submitted yet

  $scope.min_date = new Date(new Date() - 30 * 86400000);
  $scope.max_date = new Date();

  // compensate for UTC offset here
  $scope.form_data = {
    min_date : new Date($scope.min_date.getTime() + $scope.min_date.getTimezoneOffset() * -1 * 60 * 1000).toISOString(),           // 30 days ago
    max_date : new Date($scope.max_date.getTime() + $scope.max_date.getTimezoneOffset() * -1 * 60 * 1000).toISOString(),          // today
  };

  if($scope.user.role == "user")        // set identity for user
    $scope.form_data.pn = $scope.user.identities[0];  // set first identity

  // get db_data
  $http({
    method  : 'GET',
    url     : '/api/db_data'
  })
  .then(function(response) {
    $scope.db_data = response.data;
    setup_calendars_time($scope);
  });
}
// --------------------------------------------------------------------------------------
// handle sorting in search controller
// --------------------------------------------------------------------------------------
function handle_sort_search($scope, $http, data_func)
{
  $scope.sort = "&sort=-timestamp";     // sort asccending by timestamp
  $scope.sort_dir = false;   // just for frontend icons

  $scope.change_sort = function() {
    if($scope.sort == "&sort=-timestamp")
      $scope.sort = "&sort=+timestamp";
    else
      $scope.sort = "&sort=-timestamp";

    $scope.sort_dir = !$scope.sort_dir;     // negate sort direction
    $scope.get_page($http, $scope.paging.current_page, data_func);  // get page for with new sorting
  }
}
// --------------------------------------------------------------------------------------
// setup calendars with enabled time
// --------------------------------------------------------------------------------------
function setup_calendars_time($scope)
{
  flatpickr("#min_date", {
    locale: "cs",
    defaultDate: $scope.form_data.min_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "H:i d.m.Y",
    dateFormat: "Y-m-dTH:i:S",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.logs.min,       // min from db
    enableTime: true,
    time_24hr : true,
    utc : true
  });

  flatpickr("#max_date", {
    locale: "cs",
    defaultDate: $scope.form_data.max_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "H:i d.m.Y",
    dateFormat: "Y-m-dTH:i:S",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.logs.min,       // min from db
    enableTime: true,
    time_24hr : true,
    utc : true
  });
}
// --------------------------------------------------------------------------------------
// set form field values from another view
// --------------------------------------------------------------------------------------
function set_params($scope, $stateParams)
{
  var keys = Object.keys($stateParams);
  var empty = true;

  for(var key in keys) {
    if($stateParams[keys[key]]) {
      empty = false;
      $scope.form_data[keys[key]] = $stateParams[keys[key]];
    }
  }

  if(!empty) {    // params not empty
    $scope.$watch('main_form', function(main_form) {
      if(main_form)
        $scope.submit(main_form); // automatically click search button when form is ready
    });
  }
}
// --------------------------------------------------------------------------------------
// set internal variable from form data variables
// --------------------------------------------------------------------------------------
function set_utc($scope)
{
  $scope.min_date = new Date($scope.form_data.min_date);
  $scope.min_date = new Date($scope.min_date.getTime() + $scope.min_date.getTimezoneOffset() * 60 * 1000);  // substract UTC offset
  $scope.max_date = new Date($scope.form_data.max_date);
  $scope.max_date = new Date($scope.max_date.getTime() + $scope.max_date.getTimezoneOffset() * 60 * 1000);  // substract UTC offset
}
// --------------------------------------------------------------------------------------
// get logs collection data
// --------------------------------------------------------------------------------------
function get_logs($scope, $http, qs, callback)
{
  $scope.table_data = [];

  set_utc($scope);  // set internal variables and use them in query string

  var ts = "timestamp>=" + $scope.min_date.toISOString() + "&timestamp<" + $scope.max_date.toISOString();   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/search/' + qs + ts + $scope.sort
  })
  .then(function(response) {
    if(!$scope.download_url)
      $scope.download_url = '/api/search/' + qs + ts + $scope.sort;   // set download url
    $scope.table_data = transform_timestamp(response.data);
    callback($scope);
  }, function (response) {
    $scope.error = true;   // error occured
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  });
}
// --------------------------------------------------------------------------------------
// transform iso timestamp to czech format
// --------------------------------------------------------------------------------------
function transform_timestamp(data)
{
  for(var item in data) {
    data[item].timestamp = data[item].timestamp.replace(/^.*T/, '').split(':')[0] + ":" + data[item].timestamp.replace(/^.*T/, '').split(':')[1] + " "+ data[item].timestamp.replace(/T.*$/, '').split('-')[2] + "." + data[item].timestamp.replace(/T.*$/, '').split('-')[1] + "." +  data[item].timestamp.replace(/T.*$/, '').split('-')[0];
  }

  return data;
}
// --------------------------------------------------------------------------------------
// handle sumbit for form only with input fields
// --------------------------------------------------------------------------------------
function handle_search_submit($scope, $http, data_func, paging, coll_name)
{
  $scope.submit = function (form) {
    $scope.paging.total_items = 0;      // no items yet
    $scope.error = false; // begin submitting - no error yet
    $scope.base_qs = build_qs_search($scope.form_data);  // create query string
    $scope.qs = $scope.base_qs;
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.paging.current_page = 1;
    $scope.get_page($http, $scope.paging.current_page, data_func);
    $scope.submitted = true;
  }
}
// --------------------------------------------------------------------------------------
// build query string based form data
// add all defined form field values to query string
// --------------------------------------------------------------------------------------
function build_qs_search(data)
{
  ret = "?";
  var keys = Object.keys(data);

  for(var key in keys) {
    if(keys[key] == "csi") {
      ret += normalize_mac(data);
    }
    else {
      if(data[keys[key]])
        ret += keys[key] + "=" + data[keys[key]] + "&";
    }
  }

  return ret;       // returned value is '?' or '?.*&'
}
// --------------------------------------------------------------------------------------
// normalize input for mac address
// --------------------------------------------------------------------------------------
function normalize_mac(data)
{
  var ret = data["csi"].replace(/[:\.-]/g, "").toLowerCase();
  return "csi=" + ret + "&";
}
// --------------------------------------------------------------------------------------
// mac count table controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('mac_count_controller', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  init($scope, $http);
  addiational_fields_mac_count($scope);   // set up additional form fields
  $scope.paging = {
    items_by_page : $scope.user.items_by_page || 10,
    current_page : 1,
    filters : {         // must match route qs names
      username : "",
      addrs : ""
    },
    loading : false,
    total_items : 0
  };
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_table_submit($scope, $http, get_mac_count, null, $scope.paging, [ "username", "count" ], "mac_count");
  handle_pagination($scope, $http, $rootScope, get_mac_count);
  setup_filters($scope, $http, "mac_count");
  handle_download($scope, $http, ["username", "count", "addrs" ]);
  handle_anon($scope);
}]);
// --------------------------------------------------------------------------------------
// handle checkbox for anonymous users
// --------------------------------------------------------------------------------------
function handle_anon($scope)
{
  $scope.anon_sel = false;  // anonymous users not selected

  $scope.add_anon = function() {
    // $scope.anon_sel is automatically set by user clicking the checkbox by model attribute
    if($scope.anon_sel) {
      $scope.options.username.val = '^[^anon|^@]';
      $scope.options.username.sel = "like";
    }
    else {
      $scope.options.username.val = ''; // clear
    }
  }

  $scope.remove_anon = function() {
    if($scope.anon_sel == true) {
      $scope.anon_sel = false;
      $scope.options.username.val = '';
    }
  }
}
// --------------------------------------------------------------------------------------
// setup filtering fields
// params:
// $scope
// $http
// coll_name  - name of the collection in api
// --------------------------------------------------------------------------------------
function setup_filters($scope, $http, coll_name)
{
  $scope.filter_username = function () {
    set_filter($scope, $scope.paging.filters.username, "username");
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.paging.current_page = 1;                   // set to first page
    $scope.get_page($http, $scope.paging.current_page, get_mac_count);
  }

  $scope.filter_addrs = function () {
    set_filter($scope, $scope.paging.filters.addrs, "addrs");
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.paging.current_page = 1;                   // set to first page
    $scope.get_page($http, $scope.paging.current_page, get_mac_count);
  }

  $scope.filter_mac_address = function() {
    set_filter($scope, $scope.paging.filters.mac_address, "mac_address");
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.paging.current_page = 1;                   // set to first page
    $scope.get_page($http, $scope.paging.current_page, get_shared_mac);
  }

  $scope.filter_users = function() {
    set_filter($scope, $scope.paging.filters.users, "users");
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.paging.current_page = 1;                   // set to first page
    $scope.get_page($http, $scope.paging.current_page, get_shared_mac);
  }

  $scope.filter = "";   // filter is empty
}
// --------------------------------------------------------------------------------------
// add filtering to query string
// params:
// $scope
// filter   - current value of filtering field
// var_name - name of filtering variable in query string
// --------------------------------------------------------------------------------------
function set_filter($scope, filter, var_name)
{
  // TODO - possible param to distinct regex or exact match

  if(filter) {      // filter not empty
    if($scope.filter.indexOf(var_name) == -1) { // filter not present in qs yet
      $scope.filter += var_name + "=/" + filter + "/&"; // add to final filter
    }
    else {      // filter present
      $scope.filter = $scope.filter.replace(new RegExp(var_name + "=\/[^=]*\/&"), var_name + "=/" + filter + "/&"); // replace value
    }
  }
  else {        // filter is empty
    // no '=' inside filter value permitted
    $scope.filter = $scope.filter.replace(new RegExp(var_name + "=\/[^=]*\/&"), '');   // delete filter
  }

  $scope.qs = $scope.base_qs + $scope.filter;   // set final qs with filters
}
// --------------------------------------------------------------------------------------
// unset loading and scroll browser to results
// --------------------------------------------------------------------------------------
function scroll_to_results($scope)
{
  $scope.paging.loading = false;      // unset loading

  // scroll to table
  $('html, body').animate({
    scrollTop: ($("#out").offset().top - 55)     // compensate for navbar
  });
}
// --------------------------------------------------------------------------------------
// set pagination handlers
// params:
// $scope
// $http
// data_func - function which retrieves data by url
// --------------------------------------------------------------------------------------
function handle_pagination($scope, $http, $rootScope, data_func)
{
  $scope.page_changed = function(newPageNumber) {
    get_page($http, newPageNumber, data_func);
  };

  function get_page($http, page_number, data_func) {
    $scope.got_data = false;

    // set loading
    $scope.paging.loading = true;
    $scope.paging.current_page = page_number;   // set current page
    var qs = $scope.add_paging($scope.qs, $scope.paging);    // save qs to $scope

    data_func($scope, $http, qs, function ($scope) { // get data from api
      if($scope.got_total_items == true)        // already have number of items, data function finished too
        scroll_to_results($scope);

      $scope.got_data = true;
    });
  }

  $scope.get_page = get_page;

// ==========================================
// add paging to query string
// params: 
// qs     - query string
// paging - paging information
// ==========================================

  $scope.add_paging = function (qs, paging) {
    var ret = qs;
    
    if(paging.current_page > 1) {
      ret += "skip=" + ((paging.current_page - 1) *  paging.items_by_page) + "&";
    }

    ret += "limit=" + paging.items_by_page + "&";
    
    var filter_keys = Object.keys(paging.filters);
    for(var key in filter_keys) {
      if(paging.filters[filter_keys[key]]) {
        ret += filter_keys[key] + "=" + paging.filters[filter_keys[key]] + "&";
      }
    }

    return ret;
  }

  // ==========================================
  $scope.$watch('paging.items_by_page', function(new_val, old_val) {
    if(new_val === old_val) // no change
      return;

    update_user_paging($scope, $http, $rootScope);
  });
}
// --------------------------------------------------------------------------------------
// save current items_by_page value to user session
// --------------------------------------------------------------------------------------
function update_user_paging($scope, $http, $rootScope)
{
  $http({
    method  : 'PUT',
    url     : '/api/user/settings/' + $scope.paging.items_by_page
  })
  .then(function(response) {
    $scope.user = response.data;       // save updated value to scope
    $rootScope.user = response.data;    // update value in all views
  });
}
// --------------------------------------------------------------------------------------
// initialize
// --------------------------------------------------------------------------------------
function init($scope, $http)
{
  $scope.submitted = false; // form has not been submitted yet

  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
  };
  
  // get db_data
  $http({
    method  : 'GET',
    url     : '/api/db_data'
  })
  .then(function(response) {
    $scope.db_data = response.data;
    setup_calendars($scope);
  });
}
// --------------------------------------------------------------------------------------
// logic on form submit
// params: 
// $scope
// $http
// data_func  - function which retrieves data for graph
// custom_qs_func - custom function to build query string
// paging     - paging information
// form_items - array of form fields
// coll_name  - name of the collection in api
// --------------------------------------------------------------------------------------
function handle_table_submit($scope, $http, data_func, custom_qs_func, paging, form_items, coll_name)
{
  $scope.submit = function (form) {
    if(form.$valid) {
      add_options($scope);        // add optional form fields
      if(custom_qs_func)
        $scope.base_qs = custom_qs_func($scope, $scope.form_data, form_items);  // create custom query string
      else
        $scope.base_qs = build_qs($scope.form_data, form_items);  // create query string
      $scope.qs = $scope.base_qs;
      get_total_items($scope, $http, coll_name);        // set number of total items for paging
      $scope.paging.current_page = 1;
      $scope.get_page($http, $scope.paging.current_page, data_func);
      $scope.submitted = true;
    }
  }
}
// --------------------------------------------------------------------------------------
// generic function to get total items for given timestamp interval
// params: 
// $scope
// $http
// coll_name - name of the collection for which the count should be returned
// --------------------------------------------------------------------------------------
function get_total_items($scope, $http, coll_name)
{
  $scope.got_total_items = false;

  $http({
    method  : 'GET',
    url     : '/api/count/' + coll_name + "/" + $scope.qs + "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date
  })
  .then(function(response) {
    $scope.paging.total_items = response.data;

    if($scope.got_data == true) // got both data and total items
      scroll_to_results($scope);

    $scope.got_total_items = true;
  },
  function (response) {
    $scope.error = true;   // error occured
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  });
}
// --------------------------------------------------------------------------------------
// logic on form submit
// params: 
// $scope
// $http
// $q
// data_func - function which retrieves data for graph
// graph_func - function which draws graph
// form_items - array of form fields
// --------------------------------------------------------------------------------------
function handle_submit($scope, $http, $q, data_func, graph_func, form_items)
{
  $scope.submit = function (form) {
    if(form.$valid) {
      // set loading animation
      $scope.loading = true;
      if($scope.paging)
        $scope.paging.total_items = 0;      // no items yet

      add_options($scope);        // add optional form fields
      get_days($scope);                           // get array of days in specified interval
      qs = build_qs($scope.form_data, form_items);  // create query string
      data_func($scope, $http, qs, $q, function ($scope) { // get data from api
        graph_func($scope);    // draw graph
        // unset loading animation
        $scope.loading = false;
      });
    }
  }
}
// --------------------------------------------------------------------------------------
// add options to form data
// --------------------------------------------------------------------------------------
function add_options($scope)
{
  // add optional fields to form data
  // radio buttons indicate type of value
  if($scope.options) {
    var keys = Object.keys($scope.options);

    for(var key in keys) {
      if($scope.options[keys[key]].val.length > 0) {    // value is defined
        $scope.form_data[keys[key]] = $scope.options[keys[key]];    // add dict with current radio selection inside
      }
    }
  }
}
// --------------------------------------------------------------------------------------
// get mac count data
// --------------------------------------------------------------------------------------
function get_mac_count($scope, $http, qs, callback)
{
  $scope.table_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/mac_count/' + qs + ts + "&sort=-count"      // always sort by mac address count
  })
  .then(function(response) {
    if(!$scope.download_url)
      $scope.download_url = '/api/mac_count/' + qs + ts + "&sort=-count";   // set download url
    $scope.table_data = response.data;
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// get all days between min and max
// --------------------------------------------------------------------------------------
function get_days($scope)
{
  // TODO - fix db data UTC offset
  // TODO - fix iteration when overcoming DST

  $scope.days = [];

  var min = new Date($scope.form_data.min_date);
  var max = new Date($scope.form_data.max_date);

  // iterate from min to max by days
  for(var i = min; i < max; i.setTime(i.getTime() + 86400000)) {
    $scope.days.push(i.toISOString().replace(/T.*$/, ''));
  }
}
// --------------------------------------------------------------------------------------
// intialize flatpicker
// --------------------------------------------------------------------------------------
function setup_calendars($scope)
{
  flatpickr("#min_date", {
    locale: "cs",
    defaultDate: $scope.form_data.min_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.logs.min        // min from db
  });

  flatpickr("#max_date", {
    locale: "cs",
    defaultDate: $scope.form_data.max_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.logs.min        // min from db
  });
}
// --------------------------------------------------------------------------------------
// set up additional fields for form
// --------------------------------------------------------------------------------------
function addiational_fields_mac_count($scope)
{
  $scope.options_added = false;
  $scope.options = {
    username : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    count : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    }
  };

  $scope.add_options = function() {
    $scope.options_added = true;
  };

  $scope.delete_options = function() {
    $scope.options_added = false;
  };
}
// --------------------------------------------------------------------------------------
// draw graph with data from api
// --------------------------------------------------------------------------------------
function graph_orgs($scope)
{
  // taken from
  // https://bl.ocks.org/d3noob/bdf28027e0ce70bd132edc64f1dd7ea4
  // http://bl.ocks.org/Caged/6476579
  // http://bl.ocks.org/biovisualize/5372077

  // http://stackoverflow.com/questions/21639305/d3js-take-data-from-an-array-instead-of-a-file
  // ============================================================================

  // set the dimensions and margins of the graph
  var margin = {top: 50, right: 20, bottom: 100, left: 80};
  var col_length = 40;  // column length
  
  // dynamically determine graph width by size of data
  var width = $scope.graph_data.length * col_length - margin.left - margin.right;
  var height = 530 - margin.top - margin.bottom;
  var data = $scope.graph_data;

  // graph width is set to fit the page width
  width = $(window).width() - 130;      // compensate for y axis labels

  // ==========================================================

  // set the ranges
  var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
  var y = d3.scaleLinear()
            .range([height, 0]);
 
  // ==========================================================
            
  var svg = d3.select("#graph");

  if(svg.html() == "") {    // no graph present yet
    svg = svg.append("svg");
  }
  else {    // graph already present
    svg = svg.selectAll("div > svg").remove("svg"); // delete it
    svg = d3.select("#graph").append("svg");        // and create again
  }
 
  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  svg = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

  // ==========================================================

  // tooltip
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
    return "<strong>počet:</strong> <span style='color:red'>" + d.value + "</span>";
  })

  svg.call(tip);

  // ==========================================================
 
  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.inst_name; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  // ==========================================================

  var formatter = function(d){
    var format = d3.format("d")
    return format(d);
  }

  function get_unique(value, index, self) { return self.indexOf(value) === index; }
  var y_unique = y.ticks().map(formatter).filter(get_unique);

  // ==========================================================

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.inst_name); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  // ==========================================================

  // add the x Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      // rotate text by 60 degrees
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(60)")
      .style("text-anchor", "start");

  // add the y Axis
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y)
      .tickFormat(d3.format("d")) // custom format - disable comma for thousands
      .tickSize(-width, 0, 0)
      .tickValues(y_unique));     // unique y values

  // ==========================================================

  // set graph title
  svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")  
    .style("font-size", "20px")
    .style("text-decoration", "underline")  
    .text($scope.graph_title);

  // determine min and max dates for graph title
  var min = $scope.form_data.min_date.split('-')[2] + "." + $scope.form_data.min_date.split('-')[1] + "." + $scope.form_data.min_date.split('-')[0];
  var max = $scope.form_data.max_date.split('-')[2] + "." + $scope.form_data.max_date.split('-')[1] + "." + $scope.form_data.max_date.split('-')[0];

  // set graph dates
  svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 25 - (margin.top / 2))   // place under title
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text(min + " - " + max);
}
// --------------------------------------------------------------------------------------
// failed logins controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('failed_logins_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields_failed_logins($scope);   // set up additional form fields
  $scope.grouped = true;
  $scope.graph_title = "neúspěšná přihlášení";
  handle_submit($scope, $http, $q, get_failed_logins, graph, [ "username", "fail_count", "ok_count", "ratio" ]);
}]);
// --------------------------------------------------------------------------------------
// additional form fields for failed logins
// --------------------------------------------------------------------------------------
function addiational_fields_failed_logins($scope)
{
  $scope.options_added = false;
  $scope.options = {
    username : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    fail_count : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    },
    ok_count : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    },
    ratio : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    }
  };

  $scope.add_options = function() {
    $scope.options_added = true;
  };
  
  $scope.delete_options = function() {
    $scope.options_added = false;
  };
}
// --------------------------------------------------------------------------------------
// build query string based on input:
// data: dict -> form_data
// items: array of form fields
// --------------------------------------------------------------------------------------
function build_qs(data, items)
{
  ret = "?";

  for(var item in items) {
    if(data[items[item]] && data[items[item]].val) {  // item present in form data and value is defined
      switch(data[items[item]].sel) {   // switch for all possible value types
        case "eq":
          ret += build_part(ret, items[item], "=", data[items[item]].val, "");
          break;

        case "like":
          ret += build_part(ret, items[item], "=/", data[items[item]].val, "/");  // TODO - escaping ?
          break;

        case "gt":
          ret += build_part(ret, items[item], ">", data[items[item]].val, "");
          break;

        case "lt":
          ret += build_part(ret, items[item], "<", data[items[item]].val, "");
          break;
      }
    }
  }

  if(ret.length > 1)
    ret += "&";

  return ret;       // returned value is '?' or '?.*&'
}
// --------------------------------------------------------------------------------------
// build part of query string from given params
// params:
// qs - current query string
// key - variable name
// fs - forward separator
// value - variable value
// bs - back separator
// --------------------------------------------------------------------------------------
function build_part(qs, key, fs, value, bs)
{
  if(qs.length == 1)
    return key + fs + value + bs;
  else
    return "&" + key + fs + value + bs;
}
// --------------------------------------------------------------------------------------
// get mac count data
// --------------------------------------------------------------------------------------
function get_failed_logins($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];

  var ts = "timestamp=";    // timestamp

  $scope.days.forEach(function (day, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/failed_logins/' + qs + ts + day
      })
      .then(function(response) {
        // config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
        var ts;
        var arr = response.config.url.split("?")[1].split("&");

        for(var item in arr) {  // find timestamp in query string variables
          if(arr[item].indexOf("timestamp") != -1) {
            ts = arr[item].split("=")[1].split("-");
            break;
          }
        }
        
        ts = ts[2] + "." + ts[1] + "." + ts[0];     // czech format - eg 01.11.2016
        $scope.graph_data.push({ timestamp : ts,
                           value : sum_fail_count(response.data)});
      });
    });
  });

  // the final chain object will resolve once all the posts have completed.
  chain.then(function() {
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// compute sum of fail count for given data
// --------------------------------------------------------------------------------------
function sum_fail_count(data)
{
  var cnt = 0;

  for(var item in data) {
    cnt += data[item].fail_count;
  }

  return cnt;
}
// --------------------------------------------------------------------------------------
// shared mac controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('shared_mac_controller', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  init($scope, $http);
  addiational_fields_shared_mac($scope);   // set up additional form fields
  $scope.paging = {
    items_by_page : $scope.user.items_by_page || 10,
    current_page : 1,
    filters : {         // must match route qs names
      mac_address : "",
      users : ""
    },
    loading : false,
    total_items : 0
  };
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_table_submit($scope, $http, get_shared_mac, null, $scope.paging, [ "mac_address", "count" ], "shared_mac");
  handle_pagination($scope, $http, $rootScope, get_shared_mac);
  setup_filters($scope, $http, "shared_mac");
  handle_download($scope, $http, ["mac_address", "count", "users"]);
  popover();
}]);
// --------------------------------------------------------------------------------------
// set up additional fields for form
// --------------------------------------------------------------------------------------
function addiational_fields_shared_mac($scope)
{
  $scope.options_added = false;
  $scope.options = {
    mac_address : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    count : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    }
  };

  $scope.add_options = function() {
    $scope.options_added = true;
  };

  $scope.delete_options = function() {
    $scope.options_added = false;
  };

  $scope.check_filtered = function(username) {
    return /^\*filtered\*@.*$/.test(username);
  }
}
// --------------------------------------------------------------------------------------
// get shared mac data
// --------------------------------------------------------------------------------------
function get_shared_mac($scope, $http, qs, callback)
{
  $scope.table_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/shared_mac/' + qs + ts + "&sort=-count"      // always sort by mac address count
  })
  .then(function(response) {
    if(!$scope.download_url)
      $scope.download_url = '/api/shared_mac/' + qs + ts + "&sort=-count";   // set download url
    $scope.table_data = response.data;
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// get roaming most used for given query string
// --------------------------------------------------------------------------------------
function get_roaming_most_used($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];

  var ts = "timestamp=";    // timestamp

  $scope.days.forEach(function (day, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/roaming/most_used/' + qs + ts + day
      })
      .then(function(response) {
        // config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
        var ts;
        var arr = response.config.url.split("?")[1].split("&");

        for(var item in arr) {  // find timestamp in query string variables
          if(arr[item].indexOf("timestamp") != -1) {
            ts = arr[item].split("=")[1].split("-");
            break;
          }
        }
        
        ts = ts[2] + "." + ts[1] + "." + ts[0];     // czech format - eg 01.11.2016
        $scope.graph_data.push({ timestamp : ts,
                           value : sum_used_count(response.data)});
      });
    });
  });

  // the final chain object will resolve once all the posts have completed.
  chain.then(function() {
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// sum used count for given data
// --------------------------------------------------------------------------------------
function sum_used_count(data)
{
  var cnt = 0;

  for(var item in data) {
    cnt += data[item].used_count;
  }

  return cnt;
}
// --------------------------------------------------------------------------------------
// get roaming most provided for given query string
// --------------------------------------------------------------------------------------
function get_roaming_most_provided($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];

  var ts = "timestamp=";    // timestamp

  $scope.days.forEach(function (day, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/roaming/most_provided/' + qs + ts + day
      })
      .then(function(response) {
        // config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
        var ts;
        var arr = response.config.url.split("?")[1].split("&");

        for(var item in arr) {  // find timestamp in query string variables
          if(arr[item].indexOf("timestamp") != -1) {
            ts = arr[item].split("=")[1].split("-");
            break;
          }
        }
        
        ts = ts[2] + "." + ts[1] + "." + ts[0];     // czech format - eg 01.11.2016
        $scope.graph_data.push({ timestamp : ts,
                           value : sum_provided_count(response.data)});
      });
    });
  });

  // the final chain object will resolve once all the posts have completed.
  chain.then(function() {
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// sum provided count for given data
// --------------------------------------------------------------------------------------
function sum_provided_count(data)
{
  var cnt = 0;

  for(var item in data) {
    cnt += data[item].provided_count;
  }

  return cnt;
}
// --------------------------------------------------------------------------------------
// roaming activity controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_activity_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  init($scope, $http);
  $scope.graph_title = "aktivita CZ eduroamu";
  set_calendar_opts($scope);
  addiational_fields_roaming_activity($scope);   // set up additional form fields
  handle_submit($scope, $http, $q, get_roaming, graph, ["realm", "visinst"]);
}]);
// --------------------------------------------------------------------------------------
// additional fields for roaming activity form
// --------------------------------------------------------------------------------------
function addiational_fields_roaming_activity($scope)
{
  $scope.options_added = false;
  $scope.options = {
    realm : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    visinst : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
  };

  $scope.add_options = function() {
    $scope.options_added = true;
  };

  $scope.delete_options = function() {
    $scope.options_added = false;
  };
}
// --------------------------------------------------------------------------------------
// get roaming defined by query string
// --------------------------------------------------------------------------------------
function get_roaming($scope, $http, qs, $q, callback)
{
  if(qs.indexOf("realm") == -1 && qs.indexOf("visinst") == -1)
    get_roaming_all($scope, $http, qs, $q, callback);
  else if(qs.indexOf("realm") != -1 && qs.indexOf("visinst") == -1) {
    qs = qs.replace('realm', 'inst_name');  // backend uses inst_name
    get_roaming_most_used($scope, $http, qs, $q, callback);
  }
  else if(qs.indexOf("realm") == -1 && qs.indexOf("visinst") != -1) {
    qs = qs.replace('visinst', 'inst_name');  // backend uses inst_name
    get_roaming_most_provided($scope, $http, qs, $q, callback);
  }
  else {
    qs = qs.replace('visinst', 'institutions.realm');  // replace to match backend
    get_heat_map_realm_visinst($scope, $http, qs, $q, callback);
  }
}
// --------------------------------------------------------------------------------------
// get both proided and used roaming with no limit to realm or visinst
// --------------------------------------------------------------------------------------
function get_roaming_all($scope, $http, qs, $q, callback)
{
  get_roaming_most_provided($scope, $http, qs, $q, function($scope) {
    $scope.tmp_data = $scope.graph_data;

    get_roaming_most_used($scope, $http, qs, $q, function($scope) {
      sum_data($scope, $scope.tmp_data);
      callback($scope);
    });
  });
}
// --------------------------------------------------------------------------------------
// add all data values to current graph_data values
// --------------------------------------------------------------------------------------
function sum_data($scope, data)
{
  for(var item in data) {
    $scope.graph_data[item].value += data[item].value;
  }
}
// --------------------------------------------------------------------------------------
// get roaming when both realm and visinst are specified
// --------------------------------------------------------------------------------------
function get_heat_map_realm_visinst($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];

  var ts = "timestamp=";    // timestamp
  var visinst = get_visinst($scope, qs);

  $scope.days.forEach(function (day, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/heat_map/' + qs + ts + day
      })
      .then(function(response) {
        // config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
        var ts;
        var arr = response.config.url.split("?")[1].split("&");

        for(var item in arr) {  // find timestamp in query string variables
          if(arr[item].indexOf("timestamp") != -1) {
            ts = arr[item].split("=")[1].split("-");
            break;
          }
        }
        
        ts = ts[2] + "." + ts[1] + "." + ts[0];     // czech format - eg 01.11.2016
        $scope.graph_data.push({ timestamp : ts,
                           value : sum_heat_map_count(response.data, visinst)});
      });
    });
  });

  // the final chain object will resolve once all the posts have completed.
  chain.then(function() {
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// sum count from heat map data for matching visinst
// --------------------------------------------------------------------------------------
function sum_heat_map_count(data, visinst)
{
  var cnt = 0;

  if(visinst instanceof RegExp) {   // regex
    for(var item in data) {     // iterate data
      for(var inst in data[item].institutions) {        // iterate institutions
        if(visinst.test(data[item].institutions[inst].realm) == true)  {   //  visinst matches
          cnt += data[item].institutions[inst].count;
        }
      }
    }
  }

  else {    // string
    for(var item in data) {     // iterate data
      for(var inst in data[item].institutions) {        // iterate institutions
        if(visinst == data[item].institutions[inst].realm)  {   //  visinst matches
          cnt += data[item].institutions[inst].count;
        }
      }
    }
  }

  return cnt;
}
// --------------------------------------------------------------------------------------
// returns either string or RegExp (depending on frontend radio button value)
// with visinst value
// --------------------------------------------------------------------------------------
function get_visinst($scope, query_string)
{
  var ret = query_string.match(/institutions\.realm=[^&]*/)[0].replace('institutions.realm=', '');

  if($scope.options.visinst.sel == "like") {    // regex
    ret = ret.replace(/\//g, '');
    return new RegExp(ret);
  }
  else {    // string
    return ret;
  }
}
// --------------------------------------------------------------------------------------
// oganizations most using roaming controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('orgs_roaming_most_used_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  init($scope, $http);
  $scope.form_data.inst_count = 25;
  $scope.graph_title = "organizace nejvíce využívající roaming";
  set_calendar_opts($scope);
  handle_common_submit($scope, $http, $q, get_roaming_most_used_count, stacked_graph, "roaming_most_used", "used_count");
  handle_table_download($scope, ["inst_name", "used_count", "unique_count"]);
}]);
// --------------------------------------------------------------------------------------
// create query string sorted by sort_key and limited by inst_count
// --------------------------------------------------------------------------------------
function build_sorted_qs(sort_key, inst_count)
{
  return "?sort=-" + sort_key + "&limit=" + inst_count + "&";
}
// --------------------------------------------------------------------------------------
// handle submit button
// --------------------------------------------------------------------------------------
function handle_common_submit($scope, $http, $q, data_func, graph_func, coll_name, sort_key)
{
  $scope.submit = function (form) {
    if(form.$valid) {
      $scope.loading = true;
      $scope.submitted = true; // form has been submitted
      get_days($scope);                           // get array of days in specified interval
      $scope.base_qs = build_sorted_qs(sort_key, $scope.form_data.inst_count);//
      $scope.qs = $scope.base_qs;
      data_func($scope, $http, $scope.qs, $q, function ($scope) { // get data from api
        graph_func($scope);    // draw graph
        $scope.loading = false;
      });
    }
  }
}
// --------------------------------------------------------------------------------------
// set min and max dates when appropriate radio is selected
// --------------------------------------------------------------------------------------
function set_calendar_opts($scope)
{
  $scope.timestamp_changed = function() {
    if($scope.timestamp == $scope.timestamp_opts[0]) {   // 1
      $scope.form_data.min_date = new Date(new Date().getTime() - (30 * 86400000)).toISOString().replace(/T.*$/, '');
      $scope.form_data.max_date = new Date().toISOString().replace(/T.*$/, '');
    }

    if($scope.timestamp == $scope.timestamp_opts[1]) {   // 3
      $scope.form_data.min_date = new Date(new Date().getTime() - (30 * 3 * 86400000)).toISOString().replace(/T.*$/, '');
      $scope.form_data.max_date = new Date().toISOString().replace(/T.*$/, '');
    }

    if($scope.timestamp == $scope.timestamp_opts[2]) {   // 12
      $scope.form_data.min_date = new Date(new Date().getTime() - (365 * 86400000)).toISOString().replace(/T.*$/, '');
      $scope.form_data.max_date = new Date().toISOString().replace(/T.*$/, '');
    }

    setup_calendars($scope);   // setup selected dates
  }
}
// --------------------------------------------------------------------------------------
// create graph data for organizations most using roaming
// --------------------------------------------------------------------------------------
function create_graph_data_used($scope, data)
{
  for(var item in data) {
    $scope.graph_data.push({ inst_name : data[item].inst_name,
                       value : data[item].used_count });
  }
}
// --------------------------------------------------------------------------------------
// get institutions most using roaming
// --------------------------------------------------------------------------------------
function get_roaming_most_used_count($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/roaming/most_used' + qs + ts
  })
  .then(function(response) {
    var unique = [];

    response.data.forEach(function (item, index) {
      chain = chain.then(function(){
        return $http({
          method  : 'GET',
          url     : '/api/unique_users/realm/?' + ts + "&realm=" + item.inst_name
        })
        .then(function(response) {
          unique.push(response.data);
        });
      });
    });

    chain.then(function() {
      $scope.table_data = response.data;
      create_graph_data_used($scope, response.data);
      add_unique(unique, $scope.table_data, $scope.graph_data);      // add unique count
      callback($scope);
    });
  });
}
// --------------------------------------------------------------------------------------
// oganizations most providing roaming controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('orgs_roaming_most_provided_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  init($scope, $http);
  $scope.form_data.inst_count = 25;
  $scope.graph_title = "organizace nejvíce poskytující konektivitu";
  set_calendar_opts($scope);
  handle_common_submit($scope, $http, $q, get_roaming_most_provided_count, stacked_graph, "roaming_most_provided", "provided_count");
  handle_table_download($scope, ["inst_name", "provided_count", "unique_count"]);
}]);
// --------------------------------------------------------------------------------------
// create graph data for organizations most providing roaming
// --------------------------------------------------------------------------------------
function create_graph_data_provided($scope, data)
{
  for(var item in data) {
    $scope.graph_data.push({ inst_name : data[item].inst_name,
                       value : data[item].provided_count });
  }
}
// --------------------------------------------------------------------------------------
// get organization most providing roaming
// --------------------------------------------------------------------------------------
function get_roaming_most_provided_count($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/roaming/most_provided' + qs + ts
  })
  .then(function(response) {
    var unique = [];

    response.data.forEach(function (item, index) {
      chain = chain.then(function(){
        return $http({
          method  : 'GET',
          url     : '/api/unique_users/visinst/?' + ts + "&realm=" + item.inst_name
        })
        .then(function(response) {
          unique.push(response.data);
        });
      });
    });

    chain.then(function() {
      $scope.table_data = response.data;
      create_graph_data_provided($scope, response.data);
      add_unique(unique, $scope.table_data, $scope.graph_data);      // add unique count
      callback($scope);
    });
  });
}
// --------------------------------------------------------------------------------------
// add unique count for every institution to graph data
// --------------------------------------------------------------------------------------
function add_unique(data, table_data, graph_data)
{
  for(var item in data) {
    table_data[item].unique_count = data[item];
    graph_data[item].unique_count = data[item];
    // this is needed for graphing function
    graph_data[item].value -= data[item];   // substract unique count
  }
}
// --------------------------------------------------------------------------------------
// remove limit from download url
// --------------------------------------------------------------------------------------
function remove_limit(url)
{
  var ret;

  ret = url.replace(/&limit=[0-9]+/, "");   // some params before limit
  ret = ret.replace(/limit=[0-9]+&/, "");   // limit is first, remove followind &

  return ret;
}
// --------------------------------------------------------------------------------------
// handle download button
// order is array of keys
// download only displayed data
// --------------------------------------------------------------------------------------
function handle_table_download($scope, order)
{
  $scope.download_data = function() {
    var text = get_text(order, $scope.table_data);
    // taken from https://codepen.io/YuvarajTana/pen/yNoNdZ
    var a = $('<a/>', {
      style:'display:none',
      href:'data:application/octet-stream;base64,' + btoa(text),
      download:'data.csv'
    }).appendTo('body')
    a[0].click()
    a.remove();
  }
}
// --------------------------------------------------------------------------------------
// handle download button
// order is array of keys
// --------------------------------------------------------------------------------------
function handle_download($scope, $http, order)
{
  $scope.download_data = function() {
    $scope.download_url = remove_limit($scope.download_url);

    $http({
      method  : 'GET',
      url     : $scope.download_url
    })
    .then(function(response) {
      var text = get_text(order, response.data);
      // taken from https://codepen.io/YuvarajTana/pen/yNoNdZ
      var a = $('<a/>', {
        style:'display:none',
        href:'data:application/octet-stream;base64,' + btoa(text),
        download:'data.csv'
      }).appendTo('body')
      a[0].click()
      a.remove();
    });
  }
}
// --------------------------------------------------------------------------------------
// handle download button for heat map
// --------------------------------------------------------------------------------------
function handle_download_heat_map($scope)
{
  $scope.download_data = function() {
    // taken from https://codepen.io/YuvarajTana/pen/yNoNdZ
    var text = get_text_heat_map($scope);
    var a = $('<a/>', {
      style:'display:none',
      href:'data:application/octet-stream;base64,' + btoa(text),
      download:'data.csv'
    }).appendTo('body')
    a[0].click()
    a.remove();
  }
}
// --------------------------------------------------------------------------------------
// generate csv from heat map data
// --------------------------------------------------------------------------------------
function get_text_heat_map($scope)
{
  var text = "\"\",";
  var line = 0;

  if(!$scope.graph_data) { // no data present, do nothing
    return;
  }

  // create csv header
  // ============================

  for(var key in $scope.visinst) {
    if(key == $scope.visinst.length - 1)
      text += $scope.visinst[key];

    else
      text += $scope.visinst[key] + ",";
  }
  text += "\n";

  // add data
  // ============================

  for(var realm in $scope.realms) {
    for(var visinst in $scope.visinst) {
      if(text.length > 0 && text[text.length - 1] != "\n") {   // continue
        text += "," + $scope.graph_data[Number(visinst) + (realm * $scope.visinst.length)].value;     // can be accesed as 1D linear array
      }
      else {    // beginning of line
        text += $scope.realms[line++];  // output realm and increment line number
        text += "," + $scope.graph_data[Number(visinst) + (realm * $scope.visinst.length)].value;     // can be accesed as 1D linear array
      }
    }
    text += "\n";
  }

  return text;
}
// --------------------------------------------------------------------------------------
// generate csv from table data in defined order
// --------------------------------------------------------------------------------------
function get_text(order, data)
{
  var text = "";

  if(!data) { // no data present, do nothing
    return;
  }

  // create csv header
  // ============================

  for(var key in order) {
    if(key == order.length - 1)
      text += order[key];

    else
      text += order[key] + ",";
  }
  text += "\n";

  // add data
  // ============================

  for(var item in data) {
    for(var key in order) {
      if(text.length > 0 && text[text.length - 1] != "\n") {   // continue

        if(data[item][order[key]].constructor === Array) // array
          text += ",\"" + data[item][order[key]] + "\"";      // close array into ""
        else
          text += "," + data[item][order[key]];
      }

      else {    // beginning of line
        if(data[item][order[key]].constructor === Array) // array
          text += "\"" + data[item][order[key]] + "\"";      // close array into ""

        else
          text += data[item][order[key]];
      }
    }
    text += "\n";
  }

  return text;
}
// --------------------------------------------------------------------------------------
// draw graph with data from api
// --------------------------------------------------------------------------------------
function graph($scope)
{
  // taken from
  // https://bl.ocks.org/d3noob/bdf28027e0ce70bd132edc64f1dd7ea4
  // http://bl.ocks.org/Caged/6476579
  // http://bl.ocks.org/biovisualize/5372077
  // http://stackoverflow.com/questions/21639305/d3js-take-data-from-an-array-instead-of-a-file
  // ============================================================================

  // set the dimensions and margins of the graph
  var margin = {top: 80, right: 20, bottom: 100, left: 80};
  var col_length = 40;  // column length

  // dynamically determine graph width by size of data
  var width = $scope.graph_data.length * col_length - margin.left - margin.right;
  var height = 530 - margin.top - margin.bottom;
  var data = $scope.graph_data;

  // ==========================================================
  // graph width is set to fit the page width
  width = $(window).width() - 130;      // compensate for y axis labels

  // ==========================================================

  // set the ranges
  var x = d3.scaleTime().range([width / data.length / 2, width-width / data.length / 2]);
  var y = d3.scaleLinear()
            .range([height, 0]);
 
  // ==========================================================
  
  var parseTime = d3.timeParse("%d.%m.%Y");

  data.map(function (d) {
    d.timestamp = parseTime(d.timestamp);
    return d;
  })

  // ==========================================================
            
  var svg = d3.select("#graph");

  if(svg.html() == "") {    // no graph present yet
    svg = svg.append("svg");
  }
  else {    // graph already present
    svg = svg.selectAll("div > svg").remove("svg"); // delete it
    svg = d3.select("#graph").append("svg");        // and create again
  }
 
  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  svg = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

  // ==========================================================

  // tooltip
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
    return "<strong>počet:</strong> <span style='color:red'>" + d.value + "</span>";
  })

  svg.call(tip);

  // ==========================================================
 
  // Scale the range of the data in the domains
  x.domain(d3.extent(data, function(d) { return d.timestamp; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  // ==========================================================

  var formatter = function(d){
    var format = d3.format("d")
    return format(d);
  }

  function get_unique(value, index, self) { return self.indexOf(value) === index; }
  var y_unique = y.ticks().map(formatter).filter(get_unique);
  
  // ==========================================================
  // set locale
  var cs_cz = d3.timeFormatDefaultLocale({
    "decimal": ".",
    "thousands": "",
    "grouping": [3],
    "dateTime": "%d.%d.%Y %h:%m",
    "date": "%m.%d.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"],
    "shortDays": ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"],
    "months": ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Řijen", "Listopad", "Prosinec"],
    "shortMonths": ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"]
  });
  
  var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %d"),
    formatMonth = d3.timeFormat("%B"),
    formatYear = d3.timeFormat("%Y");

  function multiFormat(date) {
    return (d3.timeSecond(date) < date ? formatMillisecond
    : d3.timeMinute(date) < date ? formatSecond
    : d3.timeHour(date) < date ? formatMinute
    : d3.timeDay(date) < date ? formatHour
    : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
    : d3.timeYear(date) < date ? formatMonth
    : formatYear)(date);
  }

  // ==========================================================

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("class", "x axis")
      .call(d3.axisBottom(x)
      .tickFormat(multiFormat))
      // rotate text by 60 degrees
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(60)")
      .style("text-anchor", "start");

  // add the y Axis
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y)
      .tickFormat(d3.format("d")) // custom format - disable comma for thousands
      .tickSize(-width, 0, 0)
      .tickValues(y_unique));     // unique y values

  // ==========================================================

  // set graph title
  svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")  
    .style("font-size", "20px")
    .style("text-decoration", "underline")  
    .text($scope.graph_title);

  // determine min and max dates for graph title
  var min = $scope.form_data.min_date.split('-')[2] + "." + $scope.form_data.min_date.split('-')[1] + "." + $scope.form_data.min_date.split('-')[0];
  var max = $scope.form_data.max_date.split('-')[2] + "." + $scope.form_data.max_date.split('-')[1] + "." + $scope.form_data.max_date.split('-')[0];

  // set graph dates
  svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 25 - (margin.top / 2))   // place under title
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text(min + " - " + max);


  // ==========================================================

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
      .data(data, function(d) { return d.timestamp; })
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.timestamp) - width / data.length / 2; })
      .attr("width", width / data.length - 1)
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  // ==========================================================
  // add grid

  // TODO ?
  //// gridlines in x axis function
  //function make_x_gridlines() {
  //  return d3.axisBottom(x)
  //    .ticks(5)
  //}

  //// add the X gridlines
  //svg.append("g")
  //    .attr("class", "grid")
  //    .attr("transform", "translate(0," + height + ")")
  //    .call(make_x_gridlines()
  //    .tickSize(-height)
  //    .tickFormat(""))

  // ==========================================================
}
// --------------------------------------------------------------------------------------
// heat map controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('heat_map_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields_heat_map($scope);
  handle_submit_heat_map($scope, $http, $q, get_heat_map, graph_heat_map);
  handle_download_heat_map($scope);
}]);
// --------------------------------------------------------------------------------------
// set up additional fields for form
// --------------------------------------------------------------------------------------
function addiational_fields_heat_map($scope)
{
  $scope.options_added = false;
  $scope.options = {
    count : {
      val : "",
      sel : "gt",
      types : [ "gt" ],
      type_names : [ "je větší" ]
    }
  };

  $scope.add_options = function() {
    $scope.options_added = true;
  };

  $scope.delete_options = function() {
    $scope.options_added = false;
  };
}
// --------------------------------------------------------------------------------------
// handle sumbit button for heat map
// --------------------------------------------------------------------------------------
function handle_submit_heat_map($scope, $http, $q, data_func, graph_func)
{
  $scope.submit = function (form) {
    // set loading animation
    $scope.loading = true;
    get_realms($scope, $http).then(function() {   // get list of realms
      data_func($scope, $http, $q, function ($scope) { // get data from api
        graph_func($scope);    // draw graph
        // unset loading animation
        $scope.loading = false;
      });
    });
  }
}
// --------------------------------------------------------------------------------------
// get heat map data
// --------------------------------------------------------------------------------------
function get_heat_map($scope, $http, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];
  $scope.response = [];

  var qs = get_ts($scope);

  $scope.visinst = clone($scope.realms);
  $scope.realms.forEach(function (realm, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/heat_map/' + qs + "&realm=" + realm
      })
      .then(function(response) {
        if(response.data.length == 0) {   // no data for realm available delete realm
          $scope.realms.splice(get_index($scope, realm), 1);        // delete realm
        }
        else
          $scope.response.push(response.data);
      });
    });
  });

  // the final chain object will resolve once all the posts have completed.
  chain.then(function() {
    if($scope.options.count.val) {
      filter_heat_data($scope, $http, $q, qs, function() {     // filter data
        for(var item in $scope.response) {
          if($scope.realms.indexOf($scope.response[item][0].realm) != -1)   // realm present in realms
            transform_heat_data($scope, $scope.response[item][0].realm, $scope.response[item]);
        }

        set_missing($scope, $scope.realms);
        sort_heat_data($scope.graph_data);     // sort data by cols and rows
        callback($scope);
      });
    }
    else {
      for(var item in $scope.response) {
        if($scope.realms.indexOf($scope.response[item][0].realm) != -1)   // realm present in realms
          transform_heat_data($scope, $scope.response[item][0].realm, $scope.response[item]);
      }

      set_missing($scope, $scope.realms);
      sort_heat_data($scope.graph_data);     // sort data by cols and rows
      callback($scope);
    }
  });
}
// --------------------------------------------------------------------------------------
// get query string timestamp from form_data
// --------------------------------------------------------------------------------------
function get_ts($scope)
{
  return "?timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;
}
// --------------------------------------------------------------------------------------
// clone object
// --------------------------------------------------------------------------------------
function clone(a) {
  return JSON.parse(JSON.stringify(a));
}
// --------------------------------------------------------------------------------------
// get list of realms
// --------------------------------------------------------------------------------------
function get_realms($scope, $http)
{
  return $http({
    method  : 'GET',
    url     : '/api/realms'
  })
  .then(function(response) {
    $scope.realms = response.data; // get realm list
  });
}
// --------------------------------------------------------------------------------------
// filter heat map data by form count
// --------------------------------------------------------------------------------------
function filter_heat_data($scope, $http, $q, qs, callback)
{
  // =============================================
  // filter visinst list

  var chain = $q.when();
  $scope.graph_data = [];

  var ts = "timestamp=";    // timestamp
  var to_delete = [];

  $scope.visinst.forEach(function (visinst, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/roaming/most_provided/' + qs + "&inst_name=" + visinst
      })
      .then(function(response) {
        if(sum_provided_count(response.data) < $scope.options.count.val)
          to_delete.push(visinst);
      });
    });
  });

  chain = chain.then(function(){
    for(var item in to_delete) {
      $scope.visinst.splice($scope.visinst.indexOf(to_delete[item]), 1);        // delete visinst
    }
  });

  // =============================================
  // filter realms
  var to_delete = [];

  $scope.realms.forEach(function (realm, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/roaming/most_used/' + qs + "&inst_name=" + realm
      })
      .then(function(response) {
        if(sum_used_count(response.data) < $scope.options.count.val) {
          to_delete.push(realm);
        }
      });
    });
  });

  // the final chain object will resolve once all the posts have completed.
  chain.then(function() {
    for(var item in to_delete) {
      if($scope.realms.indexOf(to_delete[item]) != -1)      // realm present
        $scope.realms.splice($scope.realms.indexOf(to_delete[item]), 1);        // delete realm
    }
    callback();
  });
}
// --------------------------------------------------------------------------------------
// transform response from heat map api and save to scope variable
// --------------------------------------------------------------------------------------
function transform_heat_data($scope, realm, data)
{
  for(var item in data) {
    for(var inst in data[item].institutions) {
      var dict = { row : get_index($scope, realm) };       // add realm index
      dict.col = $scope.visinst.indexOf(data[item].institutions[inst].realm);  // add visinst index
      dict.value = data[item].institutions[inst].count;  // add count

      if(dict.col == -1)  // index out of map - probably caused by filtering
        continue;                           // do not add such data

      $scope.graph_data.push(dict);        // add { row : realm index, col : visinst index, value : count }
    }
  }
}
// --------------------------------------------------------------------------------------
// set missing data to 0
// --------------------------------------------------------------------------------------
function set_missing($scope, realms)
{
  var val = 0;

  //if($scope.form_data.log_scale)
  //  val = 1;        // min value for log scale

  for(var realm in realms) {
    for(var visinst in $scope.visinst) {
      var found = $scope.graph_data.filter(function(obj) {
        return obj.row == realm && obj.col == visinst;
      });

      if(found.length > 0)  // item exists
        continue;
      else   // fill data
        $scope.graph_data.push({ row : Number(realm), col : Number(visinst), value : val });
    }
  }
}
// --------------------------------------------------------------------------------------
// sort data by column and row number
// --------------------------------------------------------------------------------------
function sort_heat_data(data)
{
  data.sort(compare_heat_data);
}
// --------------------------------------------------------------------------------------
// compare heat map data based on row
// sort first by row, then by col
// --------------------------------------------------------------------------------------
function compare_heat_data(a, b)
{
  if(a.row == b.row)  // col is equal
    return a.col - b.col;
  else  // row differs
    return a.row - b.row;
}
// --------------------------------------------------------------------------------------
// returns index in realms array
// --------------------------------------------------------------------------------------
function get_index($scope, realm)
{
  return $scope.realms.indexOf(realm);
}
// --------------------------------------------------------------------------------------
// draw heat map graph
// based on http://bl.ocks.org/ianyfchang/8119685
// --------------------------------------------------------------------------------------
function graph_heat_map($scope)
{
  // ==========================================================
  // right margin for timestamp
  var margin = { top: 170, right: 230, bottom: 50, left: 170 };
  var cellSize = 18;

  var col_number = $scope.visinst.length;
  var row_number = $scope.realms.length;

  var width = cellSize * col_number;
  var height = cellSize * row_number;

  // ==========================================================

  var rowLabel = $scope.realms;
  var colLabel = $scope.visinst;

  var hcrow = [];
  var hccol = [];

  for(var item in $scope.realms)
    hcrow.push(Number(item));

  for(var item in $scope.visinst)
    hccol.push(Number(item));

  // ==========================================================

  var data = $scope.graph_data;
  var max = d3.max(data.map(function(d) { return d.value; }));
  
  // ==========================================================

  if($scope.form_data.log_scale) {
    var colorScale = d3.scaleLog()
        .domain([1, max])
        .range([d3.interpolateBlues(0), d3.interpolateBlues(1)])
  }
  else {
    var colorScale = d3.scaleLinear()
        .domain([0, max])
        .range([d3.interpolateBlues(0), d3.interpolateBlues(1)])
  }

  // ==========================================================
    
    var svg = d3.select("#graph");

    if(svg.html() == "") {    // no graph present yet
      svg = svg.append("svg");
    }
    else {    // graph already present
      svg = svg.selectAll("div > svg").remove("svg"); // delete it
      svg = d3.select("#graph").append("svg");        // and create again
    }
 
    svg = svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // ==========================================================

    // row tooltip
    var row_tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
      return "<strong>realm:</strong> <span style='color:red'>" + d + "</span>";
    })

    svg.call(row_tip);

  // ==========================================================

    // col tooltip
    var col_tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset(function(d) {
        return [ (d.length * -5), 7];
      })
      .html(function(d) {
      return "<strong>navštívená instituce:</strong> <span style='color:red'>" + d + "</span>";
    })

    svg.call(col_tip);
    
  // ==========================================================
    
    // cell tooltip
    var cell_tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<strong>realm:</strong> " + $scope.realms[d.row] + ", <strong>navštívená instituce:</strong> " + $scope.visinst[d.col] +
               " <span style='color:red'>" + d.value + "</span>";
    })

    svg.call(cell_tip);

  // ==========================================================

    var rowSortOrder = false;
    var colSortOrder = false;
    var rowLabels = svg.append("g")
        .selectAll(".rowLabelg")
        .data(rowLabel)
        .enter()
        .append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return hcrow.indexOf(i) * cellSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + cellSize + ")")
        .attr("class", function (d, i) { return "rowLabel mono r" + i; }) 
        .on('mouseover', row_tip.show)
        .on('mouseout', row_tip.hide)
        .on("click", function(d, i) { 
          rowSortOrder = !rowSortOrder; 
          sortbylabel("r", i, rowSortOrder);
        });

  // ==========================================================

    var colLabels = svg.append("g")
        .selectAll(".colLabelg")
        .data(colLabel)
        .enter()
        .append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return hccol.indexOf(i) * cellSize; })
        .style("text-anchor", "left")
        .attr("transform", "translate(" + cellSize  + ",-6) rotate (-90)")
        .attr("class",  function (d,i) { return "colLabel mono c" + i; })
        .on('mouseover', col_tip.show)
        .on('mouseout', col_tip.hide)
        .on("click", function(d,i) { 
          colSortOrder= !colSortOrder;  
          sortbylabel("c", i, colSortOrder);
        });

  // ==========================================================

    var heatMap = svg.append("g").attr("class", "g3")
          .selectAll(".cellg")
          .data(data,function(d) { return d.row + ":" + d.col; })
          .enter()
          .append("rect")
          .attr("x", function(d) { return (hccol.indexOf(d.col)) * cellSize + 6; })     // compensate for labels
          .attr("y", function(d) { return (hcrow.indexOf(d.row)) * cellSize + 4; })     // compensate for labels
          .attr("class", function(d) { return "cell cell-border cr" + d.row + " cc" + d.col; })
          .attr("width", cellSize)
          .attr("height", cellSize)
          .style("fill", function(d) { return colorScale(d.value); })
          .on('mouseover', cell_tip.show)
          .on('mouseout', cell_tip.hide);

  // ==========================================================
  // Change ordering of cells

    function sortbylabel(rORc, i, sortOrder) {
      var t = svg.transition().duration(3000);
      var values = [];
      var sorted; // sorted is zero-based index

      // data is sorted ascending by row
      // no order is defined on col
      // row or column
      if(rORc == "r") {     // row
        var idx = data.map(function(e) { return e.row }).indexOf(i);     // find row index

        // add values from data
        while(data[idx].row == i && idx < data.length - 1) {
          values[data[idx].col] = data[idx].value;
          idx++;
        }

        // ==================================================

        sorted = d3.range(col_number).sort(function(a, b) {
          if(sortOrder)
            return values[b] - values[a];
          else
            return values[a] - values[b];
        });

        t.selectAll(".cell")
          .attr("x", function(d) { return sorted.indexOf(d.col) * cellSize + 6; });
        t.selectAll(".colLabel")
          .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; });
      }
      else {    // column
        // columns are not sorted!

        for(var num in hccol) {        // iterate realms by numbers
          var found = data.filter(function(obj) {
            return obj.row == num && obj.col == i;
          });

          if(found.length > 0) {   // add value
            values[num] = found[0].value;
          }
          //else {        // no value exists - set to zero
          //  values[num] = 0;
          //}
        }

        // ==================================================

        sorted = d3.range(row_number).sort(function(a, b) {
          if(sortOrder)
            return values[b] - values[a];
          else
            return values[a] - values[b];
        });

        t.selectAll(".cell")
          .attr("y", function(d) { return sorted.indexOf(d.row) * cellSize + 4; });
        t.selectAll(".rowLabel")
          .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; });
      }
    }
  // ==========================================================
}
// --------------------------------------------------------------------------------------
// basic stacked graph for roaming views
// based on http://bl.ocks.org/mstanaland/6100713
// --------------------------------------------------------------------------------------
function stacked_graph($scope)
{
  // Setup svg using Bostock's margin convention
  var margin = {top: 80, right: 20, bottom: 100, left: 80};

  var width = $(window).width() - 130;      // compensate for y axis labels
  var height = 500 - margin.top - margin.bottom;

  // ==========================================================
   
  var svg = d3.select("#graph");

  if(svg.html() == "") {    // no graph present yet
    svg = svg.append("svg");
  }
  else {    // graph already present
    svg = svg.selectAll("div > svg").remove("svg"); // delete it
    svg = d3.select("#graph").append("svg");        // and create again
  }

  // ==========================================================

  svg = svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // ==========================================================

  var data = $scope.graph_data;

  var stack = d3.stack()
    .keys(["unique_count", "value"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  var dataset = stack(data);

  // ==================================================

  var x = d3.scaleBand()
            .domain(data.map(function(d) { return d.inst_name; }))
            .range([0, width])
            .padding(0.1);

  var y = d3.scaleLinear()
    .domain([0, d3.max(dataset, function(d) { return d3.max(d, function(d) { return d[1]; });  })])
    .range([height, 0]);

  var colors = [ "#225885", "#4682B4" ];

  // ==================================================

  // add the y Axis
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y)
      .tickSize(-width, 0, 0)
      .tickFormat(d3.format("d"))); // custom format - disable comma for thousands

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("class", "x axis")
      .call(d3.axisBottom(x))
      // rotate text by 60 degrees
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(60)")
      .style("text-anchor", "start");

  // ==================================================

  // set graph title
  svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")  
    .style("font-size", "20px")
    .style("text-decoration", "underline")  
    .text($scope.graph_title);

  // determine min and max dates for graph title
  var min = $scope.form_data.min_date.split('-')[2] + "." + $scope.form_data.min_date.split('-')[1] + "." + $scope.form_data.min_date.split('-')[0];
  var max = $scope.form_data.max_date.split('-')[2] + "." + $scope.form_data.max_date.split('-')[1] + "." + $scope.form_data.max_date.split('-')[0];

  // set graph dates
  svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 25 - (margin.top / 2))   // place under title
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text(min + " - " + max);

  // ==================================================

  // tooltip
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
    return "<strong>počet:</strong> <span style='color:red'>" + d[1] + "</span>";
  })

  svg.call(tip);

  // ==================================================

  // Create groups for each series, rects for each segment 
  var groups = svg.selectAll("g.cost")
    .data(dataset)
    .enter().append("g")
    .attr("class", "cost")
    .style("fill", function(d, i) { return colors[i]; });

  // ==================================================

  var rect = groups.selectAll("rect")
    .data(function(d) { return d; })
    .enter()
    .append("rect")
    .style("opacity", "0.8")
    .attr("x", function(d) { return x(d.data.inst_name); })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return Math.abs(y(d[1]) - y(d[0])); })
    .attr("width", x.bandwidth())
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  // ==================================================

  // Draw legend
  var legend = svg.selectAll(".legend")
    .data(colors)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });
   
  legend.append("rect")
    .attr("x", width - 200)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function(d, i) { return colors.slice().reverse()[i]; });
   
  legend.append("text")
    .attr("x", width - 175)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(function(d, i) { 
      switch (i) {
        case 0: return "počet využítí";
        case 1: return "unikátní zařízení";
      }
    });

  // ==================================================
}
// --------------------------------------------------------------------------------------
// custom qs building function for concurrent users controller
// --------------------------------------------------------------------------------------
function build_qs_concurrent_users($scope, form_data, form_items)
{
  var ret = build_qs(form_data, Object.keys($scope.form_data));

  ret += "revision=" + $scope.selected_rev + "&diff_needed_timediff>=" + $scope.diff_needed_timediff + "&";

  switch($scope.form_data.mac_diff) {
    case "==":  // same
      ret += "mac_diff=false&";
      break;

    case "!=":  // different
      ret += "mac_diff=true&";
      break;
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// handle sorting in concurrent users controller
// --------------------------------------------------------------------------------------
function handle_sort($scope, $http, data_func)
{
  $scope.sort = "&sort=-diff_needed_timediff";     // sort asccending by diff_needed_timediff
  $scope.sort_dir = false;   // just for frontend icons

  $scope.change_sort = function() {
    if($scope.sort == "&sort=-diff_needed_timediff")
      $scope.sort = "&sort=+diff_needed_timediff";
    else
      $scope.sort = "&sort=-diff_needed_timediff";

    $scope.sort_dir = !$scope.sort_dir;     // negate sort direction
    $scope.get_page($http, $scope.paging.current_page, data_func);  // get page for with new sorting
  }
}
// --------------------------------------------------------------------------------------
// concurrent users controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('concurrent_users_controller', ['$scope', '$http', '$q', '$rootScope', function ($scope, $http, $q, $rootScope) {
  init($scope, $http);
  additional_fields_concurrent_users($http, $scope);   // set up additional form fields
  $scope.paging = {
    items_by_page : $scope.user.items_by_page || 10,
    current_page : 1,
    filters : {         // must match route qs names
      //username : "",
      //addrs : ""
    },
    loading : false,
    total_items : 0
  };
  $scope.page_sizes = [ 10, 20, 50, 100 ];

  handle_table_submit($scope, $http, get_concurrent_users, build_qs_concurrent_users, $scope.paging, [], "concurrent_users");
  handle_pagination($scope, $http, $rootScope, get_concurrent_users);
  //setup_filters($scope, $http, "concurrent_users");      // TODO?
  handle_download($scope, $http, [ "username", "timestamp", "timestamp_1", "visinst_1", "timestamp_2", "visinst_2", "mac_address", "time_difference", "time_needed", "dist", "diff_needed_timediff" ]);
  handle_sort($scope, $http, get_concurrent_users);
}]);
// --------------------------------------------------------------------------------------
// set up additional fields for form
// --------------------------------------------------------------------------------------
function additional_fields_concurrent_users($http, $scope)
{
  $scope.options_added = false;
  $scope.options = {
    username : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    visinst_1 : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    visinst_2 : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
  };

  $scope.add_options = function() {
    $scope.options_added = true;
  };

  $scope.delete_options = function() {
    $scope.options_added = false;
  };

  $scope.swap = function() {
    var tmp = $scope.options.visinst_1.val;
    $scope.options.visinst_1.val = $scope.options.visinst_2.val;
    $scope.options.visinst_2.val = tmp;
  };

  $http({
    method  : 'GET',
    url     : '/api/concurrent_rev/'
  })
  .then(function(response) {
    $scope.revisions = response.data;
    $scope.selected_rev = $scope.revisions[$scope.revisions.length - 1];
  });

  $scope.diff_dict = { "0 minut"  : 0,
                       "5 minut"  : 300,
                       "15 minut" : 900,
                       "30 minut" : 1800,
                       "60 minut" : 3600 };
  $scope.diff_needed_timediff = $scope.diff_dict["5 minut"];   // default value to filter out bad service coverage
}
// --------------------------------------------------------------------------------------
// transform time information to local time and correct format
// transform time difference to human readable time
// --------------------------------------------------------------------------------------
function transform_data(data)
{
  for(var item in data) {
    // transform time info
    // day.month.year
    data[item].timestamp = data[item].timestamp.replace(/T.*$/, '').split('-')[2] + "." + data[item].timestamp.replace(/T.*$/, '').split('-')[1] + "." +  data[item].timestamp.replace(/T.*$/, '').split('-')[0];

    // hours:minutes
    data[item].timestamp_1 = data[item].timestamp_1.replace(/^.*T/, '').split(':')[0] + ":" + data[item].timestamp_1.replace(/^.*T/, '').split(':')[1];

    // hours:minutes
    data[item].timestamp_2 = data[item].timestamp_2.replace(/^.*T/, '').split(':')[0] + ":" + data[item].timestamp_2.replace(/^.*T/, '').split(':')[1];

    // time conversion
    data[item].time_needed = hms_string(data[item].time_needed);
    data[item].time_difference = hms_string(data[item].time_difference);
    data[item].diff_needed_timediff = hms_string(data[item].diff_needed_timediff);

    // distance conversion
    data[item].dist = convert_dist(data[item].dist);

  }

  return data;
}
// --------------------------------------------------------------------------------------
// return input converted to distance represented as string
// --------------------------------------------------------------------------------------
function convert_dist(input)
{
  var ret = "";

  if(input >= 100000) {
    ret += Math.round(input / 1000) + " km";
    return ret;
  }

  if(input >= 10000) {
    ret += (input / 1000).toFixed(1) +  " km";
    return ret;
  }

  if(input >= 1000) {
    ret += (input / 1000).toFixed(2) +  " km";
    return ret;
  }

  ret += input +  " m";

  return ret;
}
// --------------------------------------------------------------------------------------
// return input converted to hours, minutes and seconds string
// fixed format %h:%m
// both hours and minutes are fixed to 2 digits
// --------------------------------------------------------------------------------------
function hms_string(input)
{
  var hours = Math.floor(input / 3600);
  input = input % 3600;
  if(hours < 10)
    hours = "0" + hours;

  var minutes = Math.floor(input / 60);
  if(minutes < 10)
    minutes = "0" + minutes;
  input = input % 60;

  return hours + ":" + minutes;
}
// --------------------------------------------------------------------------------------
// get concurrent users data
// --------------------------------------------------------------------------------------
function get_concurrent_users($scope, $http, qs, callback)
{
  $scope.table_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/concurrent_users/' + qs + ts + $scope.sort      // sort by diff_needed_timediff
  })
  .then(function(response) {
    if(!$scope.download_url)
      $scope.download_url = '/api/concurrent_users/' + qs + ts + $scope.sort;   // set download url
    $scope.table_data = transform_data(response.data);
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// concurrent users controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('concurrent_inst_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  additional_fields_concurrent_users($http, $scope);   // set up additional form fields
  handle_submit_concurrent_inst($scope, $http, $q, get_concurrent_inst, filter_table_data, ["revision", "mac_diff", "diff_needed_timediff"]);
  handle_table_download($scope, [ "visinst_1", "visinst_2", "count" ]);
}]);
// --------------------------------------------------------------------------------------
// custom function to handle submit
// --------------------------------------------------------------------------------------
function handle_submit_concurrent_inst($scope, $http, $q, data_func, trans_func, form_items)
{
  $scope.submit = function (form) {
    if(form.$valid) {
      // set loading animation
      $scope.loading = true;

      add_options($scope);        // add optional form fields
      qs = build_qs_concurrent_users($scope, $scope.form_data, form_items);  // create query string
      data_func($scope, $http, qs, $q, function ($scope) { // get data from api
        trans_func($scope);    // transform data
        // unset loading animation
        $scope.loading = false;
      });
    }
  }
}
// --------------------------------------------------------------------------------------
// get concurrent inst data
// --------------------------------------------------------------------------------------
function get_concurrent_inst($scope, $http, qs, $q, callback)
{
  $scope.table_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/concurrent_inst/' + qs + ts
  })
  .then(function(response) {
    $scope.table_data = response.data;
    $scope.submitted = true;
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// set table table
// --------------------------------------------------------------------------------------
function filter_table_data($scope)
{
  for(var item in $scope.table_data) {
    var found = $scope.table_data.filter(function(obj) {
      return obj.visinst_2 == $scope.table_data[item].visinst_1 && obj.visinst_1 == $scope.table_data[item].visinst_2;
    });

    if(found.length > 0) {
      var index = $scope.table_data.map(function(obj) {
        return obj.visinst_2 == $scope.table_data[item].visinst_1 && obj.visinst_1 == $scope.table_data[item].visinst_2;
      }).indexOf(true);

      $scope.table_data[item].count += found[0].count;
      $scope.table_data.splice(index, 1);       // delete item
    }
  }
  $scope.table_length = $scope.table_data.length;

  // ========================================
  // sort data

  $scope.table_data.sort(compare_count);
}
// --------------------------------------------------------------------------------------
// compare table data by count
// --------------------------------------------------------------------------------------
function compare_count(a, b)
{
  return b.count - a.count
}
// --------------------------------------------------------------------------------------
// notifications controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('notifications_controller', ['$scope', '$http', function ($scope, $http) {
  get_notifications($scope, $http);
  save_notification($scope, $http);
  popover_manual();
}]);
// --------------------------------------------------------------------------------------
// get notifications from backend
// --------------------------------------------------------------------------------------
function get_notifications($scope, $http)
{
  $http({
    method  : 'GET',
    url     : '/api/user/notifications'
  })
  .then(function(response) {
    $scope.notifications = response.data;
  });
}
// --------------------------------------------------------------------------------------
// save notifications on backend
// --------------------------------------------------------------------------------------
function save_notification($scope, $http)
{
  $scope.submit = function() {
    $http({
      method  : 'PUT',
      url     : '/api/user/notifications',
      data    : $scope.notifications
    })
    .then(function(response) {
      $('[data-toggle="popover"]').popover('show'); // inform the user
      setTimeout(function () {
        $('[data-toggle="popover"]').popover('hide');
      }, 1000);
    });
  }
}
// --------------------------------------------------------------------------------------
// display popovers
// --------------------------------------------------------------------------------------
function popover_manual()
{
  $(document).ready(function(){
    $('[data-toggle="popover"]').popover({ trigger: 'manual' });
  });
}
// --------------------------------------------------------------------------------------


