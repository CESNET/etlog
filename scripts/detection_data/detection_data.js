// --------------------------------------------------------------------------------------
// simple usage:
// $ node scripts/detection_data.js >> public/partials/detection_data.html
// --------------------------------------------------------------------------------------
//const d3 = require('d3');
const d3 = require('d3v4');
const D3Node = require('d3-node')
const async = require('async');
const request = require('request');
const deasync = require('deasync');
const url_base = 'https://127.0.0.1/api';
const database = require( '../../db' );
const fs = require('fs');
const config = require('../../config/config');
// --------------------------------------------------------------------------------------
// get data for every realm
// --------------------------------------------------------------------------------------
function get_data(database, grouped, callback)
{
  var min = new Date(new Date() - 90 * 86400000);   // 90 days ago
  var max = new Date();     // today
  
  // get realm list sorted by failed auth count for previous 90 days
  database.visinst_logins.aggregate([ 
    { $match : { timestamp : { $gte : min, $lt : max }, realm : /\.cz/ } },  // limit by timestamp, cz realms
    { $group : { _id : { realm : "$realm" }, fail_count : { $sum : "$fail_count" } } },
    { $sort : { fail_count : -1 } },   // sort by count
    //{ $limit : 100 },              // limit to 100 instituons
    { $project : { realm : "$_id.realm", _id : 0 } }      // final projection
  ],
  function(err, items) {
    var html_text = [];

    for(var item in items) {
      get_visinst_data(items[item].realm, graph, html_text, grouped);
      get_realm_data(items[item].realm, graph, html_text, grouped);
    }
    
    create_output(html_text);
    callback(null);
  });
}
// --------------------------------------------------------------------------------------
// create html output
// --------------------------------------------------------------------------------------
function create_output(html_text)
{
  // custom css
  console.log("<style> .chart { display: inline-block; width: 2450px; } </style>");

  for(var item in html_text) {
    console.log(html_text[item]);
  }

  // add footer
  console.log("</div></div>");
}
// --------------------------------------------------------------------------------------
// get data for visinst or realm
// --------------------------------------------------------------------------------------
function get_api_data(realm, graph_func, html_text, inst_type, fail_func, ok_func)
{
  $scope = {};      // "scope"

  $scope.form_data = {
    min_date : new Date(new Date() - 90 * 86400000).toISOString().replace(/T.*$/, ''),      // 90 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
  };
  
  get_days($scope);     // get days
  $scope.realm = inst_type + ": '" + realm + "'";     // realm could possibly contain spaces

  // =========================================

  $scope.graph_data = [];
  for(var day in $scope.days) {
    $scope.graph_data.push({timestamp : $scope.days[day], 
                            value : fail_func($scope.days[day], realm)});
  }
  
  $scope.graph_title = "neuspesna prihlaseni";
  $scope.enable_ratio = false;
  html_text.push('<div id="container"><h2>' + $scope.realm + '</h2><div class="chart">' +  graph_func($scope));

  // =========================================

  $scope.graph_data = [];
  for(var day in $scope.days) {
    $scope.graph_data.push({timestamp : $scope.days[day], 
                            value : ok_func($scope.days[day], realm)});
  }
  
  $scope.graph_title = "uspesna prihlaseni";
  html_text.push(graph_func($scope));

  // =========================================

  $scope.graph_data = [];
  for(var day in $scope.days) {
    
    var v1 = ok_func($scope.days[day], realm);
    var v2 = fail_func($scope.days[day], realm);
    var val;

    if(v2 == 0) {
      val = v1;
    }
    else {
      val = v1 / v2;
    }

    $scope.graph_data.push(
      { timestamp : $scope.days[day], 
        value : val });
  }

  $scope.graph_title = "pomer uspesnych / neuspesnych prihlaseni";
  $scope.enable_ratio = true;
  html_text.push(graph_func($scope) + '</div></div>');
}
// --------------------------------------------------------------------------------------
// get data for one visinst from api
// --------------------------------------------------------------------------------------
function get_visinst_data(realm, graph_func, html_text, grouped)
{
  if(grouped)
    get_api_data(realm, graph_func, html_text, "visinst", get_visinst_failed_logins_grouped, get_visinst_succ_logins_grouped);

  else // non grouped data
    get_api_data(realm, graph_func, html_text, "visinst", get_visinst_failed_logins, get_visinst_succ_logins);
}
// --------------------------------------------------------------------------------------
// get data for one realm from api
// --------------------------------------------------------------------------------------
function get_realm_data(realm, graph_func, html_text, grouped)
{
  if(grouped)
    get_api_data(realm, graph_func, html_text, "realm", get_realm_failed_logins_grouped, get_realm_succ_logins_grouped);

  else // non grouped data
    get_api_data(realm, graph_func, html_text, "realm", get_realm_failed_logins, get_realm_succ_logins);
}
// --------------------------------------------------------------------------------------
// get all days between min and max
// --------------------------------------------------------------------------------------
function get_days($scope)
{
  $scope.days = [];

  var min = new Date($scope.form_data.min_date);
  var max = new Date($scope.form_data.max_date);

  // iterate from min to max by days
  for(var i = min; i < max; i.setTime(i.getTime() + 86400000)) {
    $scope.days.push(i.toISOString().replace(/T.*$/, ''));
  }
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

  const styles = '.bar{fill: steelblue;} .bar:hover{fill: brown;} .axis{font: 10px sans-serif;} .axis path,.axis line{fill: none;stroke: #000;shape-rendering: crispEdges;} .x.axis path{display: none;} .y .tick line { stroke: #ddd; } path.domain { stroke: none;} ';
  //const markup = '<div id="container"><h2>' + $scope.realm + '</h2><div id="chart"></div></div>';
  var options = {selector:'#chart', svgStyles:styles};

  var d3n = new D3Node(options);


  /// =============================================
  // begin d3 code
  // ============================================================================

  // set the dimensions and margins of the graph
  var margin = {top: 50, right: 20, bottom: 100, left: 80};
  var col_length = 40;  // column length
  
  // dynamically determine graph width by size of data
  var width = $scope.graph_data.length * col_length - margin.left - margin.right;
  var height = 530 - margin.top - margin.bottom;
  var data = $scope.graph_data;

  // graph width is set to fit the page width
  //width = $(window).width() - 130;      // compensate for y axis labels
  width = 700;

  // ==========================================================

  // set the ranges
  var x = d3.scaleTime().range([width / data.length / 2, width-width / data.length / 2]);
  var y = d3.scaleLinear()
            .range([height, 0]);
 
  // ==========================================================
  
  var parseTime = d3.timeParse("%Y-%m-%d");

  data.map(function (d) {
    d.timestamp = parseTime(d.timestamp);
    return d;
  })

  // ==========================================================
            
  var svg = d3.select(d3n.document.body).append('svg');
 
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

  if($scope.enable_ratio == true) {
    // add the y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y)
        .tickSize(-width, 0, 0)
        .tickFormat(d3.format(".2f"))); // enable floating point numbers for ratio graph
  }
  else {
    // add the y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y)
        .tickFormat(d3.format("d")) // custom format - disable comma for thousands
        .tickSize(-width, 0, 0)
        .tickValues(y_unique));     // unique y values
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
      //.on('mouseover', tip.show)
      //.on('mouseout', tip.hide);

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


  /// =============================================
  // end d3 code

  var text = d3n.html();
  text = text.replace('<html><head></head><body>', '').replace('</body></html>', '');
  return text;
}
// --------------------------------------------------------------------------------------
// get failed logins for visinst
// --------------------------------------------------------------------------------------
function get_visinst_failed_logins(date, realm)
{
  var ret = get_visinst(date, realm);

  if(ret == undefined)
    return 0;

  return ret.fail_count;
}
// --------------------------------------------------------------------------------------
// get successfull logins for visinst
// --------------------------------------------------------------------------------------
function get_visinst_succ_logins(date, realm)
{
  var ret = get_visinst(date, realm);

  if(ret == undefined)
    return 0;

  return ret.ok_count;
}
// --------------------------------------------------------------------------------------
// request data based on params
// --------------------------------------------------------------------------------------
function request_data(url, date, realm)
{
  var done = false;
  var ret;

  var d = new Date(date);
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);  // set to 00:00:00:000

  var query = '?timestamp=' + d.toISOString();
  query += "&realm=" + realm;   // limit by realm

  request.get({
    url: url_base + url + query,     // use query string here for simple usage
    headers : {
      Host : config.server_name
    }
  }, function (error, response, body) {
    if(error)
      console.error(error);
    else {
      ret = JSON.parse(body);
      done = true;
    }
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// get data for visinst for given date
// --------------------------------------------------------------------------------------
function get_visinst(date, realm)
{
  var url = "/visinst_logins/";
  return request_data(url, date, realm)[0];
}
// --------------------------------------------------------------------------------------
// get failed logins for realm
// --------------------------------------------------------------------------------------
function get_realm_failed_logins(date, realm)
{
  var ret = get_realm(date, realm);

  if(ret == undefined)
    return 0;

  return ret.fail_count;
}
// --------------------------------------------------------------------------------------
// get successfull logins for realm
// --------------------------------------------------------------------------------------
function get_realm_succ_logins(date, realm)
{
  var ret = get_realm(date, realm);

  if(ret == undefined)
    return 0;

  return ret.ok_count;
}
// --------------------------------------------------------------------------------------
// get data for realm for given date
// --------------------------------------------------------------------------------------
function get_realm(date, realm)
{
  var url = "/realm_logins/";
  return request_data(url, date, realm)[0];
}
// --------------------------------------------------------------------------------------
// get failed logins for visinst
// --------------------------------------------------------------------------------------
function get_visinst_failed_logins_grouped(date, realm)
{
  var ret = get_visinst(date, realm);

  if(ret == undefined)
    return 0;

  return ret.grouped_fail_count;
}
// --------------------------------------------------------------------------------------
// get successfull logins for visinst
// --------------------------------------------------------------------------------------
function get_visinst_succ_logins_grouped(date, realm)
{
  var ret = get_visinst(date, realm);

  if(ret == undefined)
    return 0;

  return ret.grouped_ok_count;
}
// --------------------------------------------------------------------------------------
// get failed logins for realm
// --------------------------------------------------------------------------------------
function get_realm_failed_logins_grouped(date, realm)
{
  var ret = get_realm(date, realm);

  if(ret == undefined)
    return 0;

  return ret.grouped_fail_count;
}
// --------------------------------------------------------------------------------------
// get successfull logins for realm
// --------------------------------------------------------------------------------------
function get_realm_succ_logins_grouped(date, realm)
{
  var ret = get_realm(date, realm);

  if(ret == undefined)
    return 0;

  return ret.grouped_ok_count;
}
// --------------------------------------------------------------------------------------
// main function
// --------------------------------------------------------------------------------------
function main()
{
  async.series([
      function(callback) {
        database.connect();
        callback(null, null);
      },
      function(callback) {
        if(process.argv.length > 2)
          get_data(database, true, callback);  // generate grouped data
        else
          get_data(database, false, callback); // generate non grouped data
      },
    ],
    function(err, results) {
      database.disconnect();
  });
}
// --------------------------------------------------------------------------------------
main()
// --------------------------------------------------------------------------------------
