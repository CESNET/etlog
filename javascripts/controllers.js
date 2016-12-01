// --------------------------------------------------------------------------------------
// header controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('header_controller', ['$scope', '$location', function ($scope, $location) {
  $scope.is_active = function(navbar_path) {
    for(var item in navbar_path) {      // iterate array of acceptable values
      if(navbar_path[item] === $location.path())
        return true;        // return true if matches
    }

    return false;   // return false if not
  }
}]);
// --------------------------------------------------------------------------------------
// index controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('index_controller', ['$scope', '$http', function ($scope, $http) {
}]);
// --------------------------------------------------------------------------------------
// search controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('search_controller', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
  init_search($scope, $http);
  $scope.paging = {
    items_by_page : 10,
    current_page : 1,
    filters : {         // must match route qs names
    },
    loading : false,
    total_items : 0
  };
  $scope.title = "etlog: obecné vyhledávání";
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_search_submit($scope, $http, get_logs, $scope.paging, "logs");
  handle_pagination($scope, $http, get_logs);
  setup_filters($scope, $http, "logs");
  handle_sort($scope, $http, get_logs);
  set_params($scope, $stateParams); // set params passed from other views
  handle_download($scope);
}]);
// --------------------------------------------------------------------------------------
// inittialize search variables
// --------------------------------------------------------------------------------------
function init_search($scope, $http)
{
  $scope.submitted = false; // form has not been submitted yet

  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString(),                          // 30 days ago
    max_date : new Date().toISOString(),                                                    // today
  };
  
  $scope.min_date = new Date(new Date() - 30 * 86400000);
  $scope.max_date = new Date();

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
function handle_sort($scope, $http, data_func)
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
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.mac_count.min,   // min from db
    enableTime: true,
    time_24hr : true
  });

  flatpickr("#max_date", {
    locale: "cs",
    defaultDate: $scope.form_data.max_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "H:i d.m.Y",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.mac_count.min,   // min from db
    enableTime: true,
    time_24hr : true
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
      //console.log($scope.main_form);

      // TODO

      //console.log(main_form.$valid);
      //console.log(main_form.$invalid);
      //console.log(main_form);
      //console.log(main_form.$valid);
      //console.log(main_form.$invalid);
      //console.log(main_form.$valid == true);

      //if(main_form.$valid) {
      //  console.log("submitting");
      //  $scope.submit(main_form); // automatically click search button when form is ready
      //}
    });
  }
}
// --------------------------------------------------------------------------------------
// get logs collection data
// --------------------------------------------------------------------------------------
function get_logs($scope, $http, qs, callback)
{
  $scope.table_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/search/' + qs + ts + $scope.sort
  })
  .then(function(response) {
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
    if(form.$valid) {
      $scope.error = false; // begin submitting - no error yet

      $scope.base_qs = build_qs_search($scope.form_data);  // create query string
      $scope.qs = $scope.base_qs;
      get_total_items($scope, $http, coll_name);        // set number of total items for paging
      $scope.get_page($http, $scope.paging.current_page, data_func);
      $scope.submitted = true;
    }
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
    if(data[keys[key]])
      ret += keys[key] + "=" + data[keys[key]] + "&";
  }

  return ret;       // returned value is '?' or '?.*&'
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
// mac count table controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('mac_count_controller', ['$scope', '$http', function ($scope, $http) {
  init($scope, $http);
  addiational_fields_mac_count($scope);   // set up additional form fields
  $scope.paging = {
    items_by_page : 10,
    current_page : 1,
    filters : {         // must match route qs names
      username : "",
      addrs : ""
    },
    loading : false,
    total_items : 0
  };
  $scope.title = "etlog: počet zařízení";
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_table_submit($scope, $http, get_mac_count, $scope.paging, [ "username", "count" ], "mac_count");
  handle_pagination($scope, $http, get_mac_count);
  setup_filters($scope, $http, "mac_count");
  handle_download($scope);
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
    $scope.anon_sel = false;
    $scope.options.username.val = '';
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
// set pagination handlers
// params:
// $scope
// $http
// data_func - function which retrieves data by url
// --------------------------------------------------------------------------------------
function handle_pagination($scope, $http, data_func)
{
  $scope.page_changed = function(newPageNumber) {
    get_page($http, newPageNumber, data_func);
  };

  function get_page($http, page_number, data_func) {
    // set loading
    $scope.paging.loading = true;
    $scope.paging.current_page = page_number;   // set current page
    var qs = $scope.add_paging($scope.qs, $scope.paging);    // save qs to $scope

    data_func($scope, $http, qs, function ($scope) { // get data from api
      // unset loading
      $scope.paging.loading = false;

      // scroll to table
      $('html, body').animate({
        scrollTop: ($("#out").offset().top - 55)     // compensate for navbar
      });
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
// paging     - paging information
// form_items - array of form fields
// coll_name  - name of the collection in api
// --------------------------------------------------------------------------------------
function handle_table_submit($scope, $http, data_func, paging, form_items, coll_name)
{
  $scope.submit = function (form) {
    if(form.$valid) {
      add_options($scope);        // add optional form fields
      $scope.base_qs = build_qs($scope.form_data, form_items);  // create query string
      $scope.qs = $scope.base_qs;
      get_total_items($scope, $http, coll_name);        // set number of total items for paging
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
  $http({
    method  : 'GET',
    url     : '/api/count/' + coll_name + "/" + $scope.qs + "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date
  })
  .then(function(response) {
    $scope.paging.total_items = response.data;
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
  var keys = Object.keys($scope.options);

  for(var key in keys) {
    if($scope.options[keys[key]].val.length > 0) {    // value is defined
      $scope.form_data[keys[key]] = $scope.options[keys[key]];    // add dict with current radio selection inside
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
    minDate: $scope.db_data.mac_count.min   // min from db
  });

  flatpickr("#max_date", {
    locale: "cs",
    defaultDate: $scope.form_data.max_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.mac_count.min   // min from db
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
    // TODO - transition / animation ?
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
    return "<strong>počet:</strong> <span style='color:red'>" + d.value + "</span>";    // TODO - generic tooltip text ?
  })

  svg.call(tip);

  // ==========================================================
 
  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.timestamp; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  // TODO - dynamic data update -> http://bl.ocks.org/biovisualize/5372077 ?


  // ==========================================================

  var formatter = function(d){
    var format = d3.format("d")
    return format(d);
  }

  function get_unique(value, index, self) { return self.indexOf(value) === index; }

  var y_unique = y.ticks().map(formatter).filter(get_unique);
  //console.log(y.ticks());
  //console.log(x);

  // ==========================================================
  
  //if(data.length > 15)
  //  x.domain(data.filter(function(value, index) { return index % 2 == 0; }).map(function(d) { return d.timestamp; }));

  //else if(data.length > 30)
  //  x.domain(data.filter(function(value, index) { return index % 3 == 0; }).map(function(d) { return d.timestamp; }));
  ////aconsole.log(data.length);
  
  //var x_ticks = get_x_ticks(x.ticks(), $scope.graph_data.length);

  // ==========================================================

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.timestamp); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  // ==========================================================

  // add the x Axis
  svg.append("g")
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
      .call(d3.axisLeft(y)
      .tickFormat(d3.format("d")) // custom format - disable comma for thousands
      .tickValues(y_unique));     // unique y values

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



  // TODO
  //if($scope.grouped) {
  //  console.log("grouped");

  //  d3.select('#show_failed').on('change', function() {
  //    console.log('func');
  //    //var x = d3.select('#show_failed').selectAll('.category:checked');
  //    ////var ids = x[0].map(function(category) {
  //    ////  return category.id;
  //    ////});

  //    //console.log(x);

  //    ////updateGraph(ids);
  //  });
  //  //renderGraph();
  //
  //}


}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_x_ticks(ticks, data_length)
{
  if(data_length > 15) {

  }

  console.log(ticks);

  return ticks;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('failed_logins_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields_failed_logins($scope);   // set up additional form fields
  $scope.grouped = true;
  $scope.graph_title = "neúspěšná přihlášení";
  $scope.title = "etlog: neúspěšná přihlášení";
  handle_submit($scope, $http, $q, get_failed_logins, graph, [ "username", "fail_count", "ok_count", "ratio" ]);
}]);
// --------------------------------------------------------------------------------------
// TODO
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










// --------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------
// shared mac controller
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('shared_mac_controller', ['$scope', '$http', function ($scope, $http) {
  init($scope, $http);
  addiational_fields_shared_mac($scope);   // set up additional form fields
  $scope.paging = {
    items_by_page : 10,
    current_page : 1,
    filters : {         // must match route qs names
      mac_address : "",
      users : ""
    },
    loading : false,
    total_items : 0
  };
  $scope.title = "etlog: sdílená zařízení";
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_table_submit($scope, $http, get_shared_mac, $scope.paging, [ "mac_address", "count" ], "shared_mac");
  handle_pagination($scope, $http, get_shared_mac);
  setup_filters($scope, $http, "shared_mac");
  handle_download($scope);
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
    $scope.table_data = response.data;
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_interval($scope)
{
  // TODO



  // TODO - fix db data UTC offset
  // TODO - fix iteration when overcoming DST

  $scope.days = [];

  var min = new Date($scope.form_data.min_date);
  var max = new Date($scope.form_data.max_date);

  var diff = (max - min) / 86400000;        // number of days between dates
  var step = 1;

  if(diff > 15)
    step = 2;

  if(diff > 30)
    step = 3;

  // iterate from min to max by days
  for(var i = min; i < max; i.setTime(i.getTime() + step * 86400000)) {
    $scope.days.push(i.toISOString().replace(/T.*$/, ''));
  }


}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_most_used_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields_roaming_most($scope);   // set up additional form fields
  $scope.graph_title = "organizace nejvíce využívající roaming";
  $scope.title = "etlog: organizace nejvíce využívající roaming";
  handle_submit($scope, $http, $q, get_roaming_most_used, graph, [ 'inst_name', 'provided_count', 'used_count' ]);
}]);
// --------------------------------------------------------------------------------------
// set up additional form fields
// generic function for roaming most used and provided
// --------------------------------------------------------------------------------------
function addiational_fields_roaming_most($scope)
{
  $scope.options_added = false;
  $scope.options = {
    inst_name : {
      val : "",
      sel : "like",
      types : [ "eq", "like" ],
      type_names : [ "přesně odpovídá", "obsahuje" ]
    },
    used_count : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    },
    provided_count : {
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
// TODO
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
        url     : '/api/roaming/most_used/' + qs + ts + day     // TODO - limit on fields to speed up ?
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
// TODO
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
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_most_provided_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields_roaming_most($scope);   // set up additional form fields
  $scope.graph_title = "organizace nejvíce poskytující roaming";
  $scope.title = "etlog: organizace nejvíce poskytující roaming";
  handle_submit($scope, $http, $q, get_roaming_most_provided, graph, [ 'inst_name', 'provided_count', 'used_count' ]);
}]);
// --------------------------------------------------------------------------------------
// TODO
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
        url     : '/api/roaming/most_provided/' + qs + ts + day     // TODO - limit on fields to speed up ?
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
// TODO
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
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_activity_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
  };
  $scope.graph_title = "aktivita CZ eduroamu";
  $scope.title = "etlog: aktivita CZ eduroamu";
  init_calendar($scope, $http);
  set_calendar_opts($scope);
  addiational_fields_roaming_activity($scope);   // set up additional form fields
  handle_submit($scope, $http, $q, get_roaming, graph, ["realm", "visinst"]);
}]);
// --------------------------------------------------------------------------------------
// TODO
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
// TODO
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
// TODO
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
// TODO
// --------------------------------------------------------------------------------------
function sum_data($scope, data)
{
  for(var item in data) {
    $scope.graph_data[item].value += data[item].value;
  }
}
// --------------------------------------------------------------------------------------
// TODO
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
// TODO
// --------------------------------------------------------------------------------------
function sum_heat_map_count(data, visinst)
{
  var cnt = 0;

  if(visinst instanceof RegExp) {   // regex
    for(var item in data) {     // iterate data
      console.log("iterating data");

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

  //console.log(cnt);

  return cnt;
}
// --------------------------------------------------------------------------------------
// TODO
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
// TODO
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
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('orgs_roaming_most_used_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
    inst_count : 25
  };
  $scope.graph_title = "organizace nejvíce využívající roaming";
  $scope.title = "etlog: organizace nejvíce využívající roaming";
  init_calendar($scope, $http);
  set_calendar_opts($scope);
  handle_common_submit($scope, $http, $q, get_roaming_most_used_count, graph_orgs, "roaming_most_used", "used_count");
  handle_download($scope);
}]);
// --------------------------------------------------------------------------------------
// initialize calendars
// --------------------------------------------------------------------------------------
function init_calendar($scope, $http)
{
  $scope.submitted = false; // form has not been submitted yet
  setup_calendars_minmax($scope);
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function build_sorted_qs(sort_key, inst_count)
{
  return "?sort=-" + sort_key + "&limit=" + inst_count + "&";
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function handle_common_submit($scope, $http, $q, data_func, graph_func, coll_name, sort_key)
{
  $scope.submit = function (form) {
    if(form.$valid) {
      $scope.loading = true;
      get_days($scope);                           // get array of days in specified interval
      $scope.base_qs = build_sorted_qs(sort_key, $scope.form_data.inst_count);//
      $scope.qs = $scope.base_qs;
      data_func($scope, $http, $scope.qs, $q, function ($scope) { // get data from api
        graph_func($scope);    // draw graph
        $scope.loading = false;
        $scope.submitted = true; // form has not been submitted yet
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

    setup_calendars_minmax($scope);   // setup selected dates
  }
}
// --------------------------------------------------------------------------------------
// manually assing calendar values in czech format
// --------------------------------------------------------------------------------------
function setup_calendars_minmax($scope)
{
  var tmp = $scope.form_data.min_date;

  flatpickr("#min_date", {
    locale: "cs",
    defaultDate: $scope.form_data.min_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
  });

  // strange issue here - flatpickr is tied to model, but unsets the value
  // so we need to manually set it back after setting flatpickr
  $scope.form_data.min_date = tmp;

  // =========================================

  tmp = $scope.form_data.max_date;

  flatpickr("#max_date", {
    locale: "cs",
    defaultDate: $scope.form_data.max_date,
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
  });

  // strange issue here - flatpickr is tied to model, but unsets the value
  // so we need to manually set it back after setting flatpickr
  $scope.form_data.max_date = tmp;
}
// --------------------------------------------------------------------------------------
function create_graph_data_used($scope, data)
{
  for(var item in data) {
    $scope.graph_data.push({ timestamp : data[item].inst_name,     /// TODO ???
                       value : data[item].used_count });
  }
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_roaming_most_used_count($scope, $http, qs, $q, callback)
{
  $scope.graph_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/roaming/most_used' + qs + ts
  })
  .then(function(response) {
    $scope.table_data = response.data;
    create_graph_data_used($scope, response.data);
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('orgs_roaming_most_provided_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
    inst_count : 25
  };
  $scope.graph_title = "organizace nejvíce poskytující konektivitu";
  $scope.title = "etlog: organizace nejvíce poskytující konektivitu";
  init_calendar($scope, $http);
  set_calendar_opts($scope);
  handle_common_submit($scope, $http, $q, get_roaming_most_provided_count, graph_orgs, "roaming_most_provided", "provided_count");
  handle_download($scope);
}]);
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function create_graph_data_provided($scope, data)
{
  for(var item in data) {
    $scope.graph_data.push({ timestamp : data[item].inst_name,     /// TODO ???
                       value : data[item].provided_count });
  }
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_roaming_most_provided_count($scope, $http, qs, $q, callback)
{
  $scope.graph_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  // debug
  console.log($scope.form_data);

  return $http({
    method  : 'GET',
    url     : '/api/roaming/most_provided' + qs + ts
  })
  .then(function(response) {
    // pridat pocet unikatnich za cele obdobi 
    // -> udelat dotazem na heat mapu
    // udelat jako http://bl.ocks.org/mbostock/3886208
    // db.heat_map.find({ timestamp : { $gte : d, $lt : d2}, realm : "upol.cz"} )
    // do grafu i do tabulky
    // jak pro poskytovane tak pro vyuzivane

    console.log(response.data);
    $scope.table_data = response.data;
    create_graph_data_provided($scope, response.data);
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('detection_data_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.title = "etlog: data k detekci";
}]);
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function handle_download($scope)
{
  $scope.download_data = function() {
    var text = get_text($scope);
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
// generate csv from table data
// --------------------------------------------------------------------------------------
function get_text($scope)
{
  var text = "";
  var data = $scope.table_data;

  if(!data) { // no data present, do nothing
    return;
  }

  var keys = Object.keys(data[0]);

  // filter keys
  for(var key in keys) {
    if(keys[key] == "$$hashKey")
      keys.splice(key, 1)
  }

  // create csv header
  // ============================

  for(var key in keys) {
    if(key == keys.length - 1)
      text += keys[key];

    else
      text += keys[key] + ",";
  }
  text += "\n";

  // add data
  // ============================

  for(var item in data) {
    for(var key in keys) {

      if(text.length > 0 && text[text.length - 1] != "\n") {   // continue
        if(data[item][keys[key]].constructor === Array) // array
          text += ",\"" + data[item][keys[key]] + "\"";      // close array into ""
        else
          text += "," + data[item][keys[key]];
      }

      else {    // beginning of line
        if(data[item][keys[key]].constructor === Array) // array
          text += "\"" + data[item][keys[key]] + "\"";      // close array into ""

        else
          text += data[item][keys[key]];
      }
    }
    text += "\n";
  }

  return text;
}
// --------------------------------------------------------------------------------------

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
  var margin = {top: 50, right: 20, bottom: 100, left: 80};
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

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
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
      .call(d3.axisLeft(y)
      .tickFormat(d3.format("d")) // custom format - disable comma for thousands
      .tickValues(y_unique));     // unique y values

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









