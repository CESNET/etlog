// --------------------------------------------------------------------------------------
// simple usage:
// $ node scripts/detection_data.js >> public/partials/detection_data.html
// --------------------------------------------------------------------------------------
//const d3 = require('d3');
const d3 = require('d3-v4');
const D3Node = require('d3-node')
const async = require('async');
const request = require('../request');
const database = require( '../db' );
const fs = require('fs');
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_data(database, callback)
{
  var realms = [];
  database.realms.aggregate([ 
  { $project : { _id : 0, realm : 1 } }
  ],
  function(err, items) {
    var html_text = [];

    for(var item in items) {
      get_realm_data(items[item].realm, graph, html_text);
      //break;    // debug
    }
    
    create_output(html_text);
    callback(null);
  });
}
// --------------------------------------------------------------------------------------
// TODO
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
// TODO
// --------------------------------------------------------------------------------------
function get_realm_data(realm, graph_func, html_text)
{
  $scope = {};      // "scope"

  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
  };
  
  get_days($scope);     // get days

  $scope.realm = realm;

  // =========================================

  $scope.graph_data = [];
  for(var day in $scope.days) {
    $scope.graph_data.push({timestamp : $scope.days[day], 
                            value : normalize_by_mac(request.get_failed_logins_daily($scope.days[day], realm))});
  }
  
  $scope.graph_title = "neuspesna prihlaseni";
  html_text.push('<div id="container"><h2>' + $scope.realm + '</h2><div class="chart">' +  graph_func($scope));

  // =========================================

  $scope.graph_data = [];
  for(var day in $scope.days) {
    $scope.graph_data.push({timestamp : $scope.days[day], 
                            value : normalize_by_mac(request.get_succ_logins_daily($scope.days[day], realm))});
  }
  
  $scope.graph_title = "uspesna prihlaseni";
  html_text.push(graph_func($scope));

  // =========================================

  $scope.graph_data = [];
  for(var day in $scope.days) {
    
    var v1 = normalize_by_mac(request.get_succ_logins_daily($scope.days[day], realm));
    var v2 = normalize_by_mac(request.get_failed_logins_daily($scope.days[day], realm));
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
  html_text.push(graph_func($scope) + '</div></div>');
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
// TODO
// --------------------------------------------------------------------------------------
function normalize_by_mac(data)
{
  return data.length;   // simple filtering - every user is counted once
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

  const styles = '.bar{fill: steelblue;} .bar:hover{fill: brown;} .axis{font: 10px sans-serif;} .axis path,.axis line{fill: none;stroke: #000;shape-rendering: crispEdges;} .x.axis path{display: none;}';
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


  /// =============================================
  // end d3 code

  var text = d3n.html();
  text = text.replace('<html><head></head><body>', '').replace('</body></html>', '');
  return text;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function main()
{
  async.series([
    function(callback) {
      database.connect();
      callback(null, null);
    },
    function(callback) {
      get_data(database, callback);
    },
    ],
    function(err, results) {
      database.disconnect();
  });
}
// --------------------------------------------------------------------------------------
main()
// --------------------------------------------------------------------------------------
