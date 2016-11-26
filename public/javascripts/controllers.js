// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('header_controller', ['$scope', '$location', function ($scope, $location) {
  $scope.is_active = function(navbar_path) {
    for(var item in navbar_path) {
      if(navbar_path[item] === $location.path())
        return true;
    }

    return false;
  }
}]);
// --------------------------------------------------------------------------------------
// TODO
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
// TODO 
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
// TODO
// --------------------------------------------------------------------------------------
function handle_sort($scope, $http, data_func)
{
  $scope.sort = "&sort=+timestamp";     // sort descending by timestamp
  $scope.sort_dir = true;   // just for frontend icons

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
// TODO
// --------------------------------------------------------------------------------------
function setup_calendars_time($scope)
{
  var calendars = document.getElementsByClassName("flatpickr").flatpickr({
    altInputClass : "form-control",
    altInput: true,
    altFormat: "H:i d.m.Y",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.mac_count.min,   // min from db
    enableTime: true,
    time_24hr : true
  });

  // czech format of dates
  var min = $scope.min_date.getHours() + ":" + $scope.min_date.getMinutes() + " " + $scope.min_date.getDate() + "." + Number($scope.min_date.getMonth() + 1) + "." + $scope.min_date.getFullYear();

  var max = $scope.max_date.getHours() + ":" + $scope.max_date.getMinutes() + " " + $scope.max_date.getDate() + "." + Number($scope.max_date.getMonth() + 1) + "." + $scope.max_date.getFullYear();

  // alternative hand solution
  var min_date = document.getElementById("min_date");
  var next = min_date.nextElementSibling;
  next.setAttribute("value", min);

  var max_date = document.getElementById("max_date");
  var next = max_date.nextElementSibling;
  next.setAttribute("value", max);
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

  if(!empty)    // params not empty
    $scope.submit();  // automatically click search button
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
  $scope.submit = function () {
    $scope.base_qs = build_qs_search($scope.form_data);  // create query string
    $scope.qs = $scope.base_qs;
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
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
    ret += keys[key] + "=" + data[keys[key]] + "&";
  }

  return ret;       // returned value is '?' or '?.*&'
}
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('graph_test_1_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
    get_data($scope, $http, $q);
}]);
// --------------------------------------------------------------------------------------
// get example data for graphs
// --------------------------------------------------------------------------------------
function get_data($scope, $http, $q)
{
  inst_name = username = /.*@cvut\.cz/;
  get_realms($scope, $http);  
  get_min_max($scope, $http, function() {
    get_days($scope, $http);        // no callback needed here
    //get_failed_logins($scope, $http, username); // works fine
      get_heat_map_data($scope, $http, heat_map);
  });

}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_heat_map_data($scope, $http, callback)
{
  // debug
  //console.log($scope.db_data);

  $http({
    method  : 'GET',
    //url     : '/api/heat_map/?timestamp>=' + $scope.db_data.heat_map.min.replace(/T.*$/, '') + "&timestamp<" + $scope.db_data.heat_map.max.replace(/T.*$/, '')
    url     : '/api/heat_map/?timestamp>=' + $scope.db_data.heat_map.min.replace(/T.*$/, '') + "&timestamp<" + $scope.db_data.heat_map.max.replace(/T.*$/, '' + "&realm=cvut.cz")
  })
  .then(function(response) {
    $scope.heat_map = response.data;
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_realms($scope, $http)
{
  $http({
    method  : 'GET',
    url     : '/api/realms'
  })
  .then(function(response) {
    $scope.realms = response.data; // get realm list
  });
}
// --------------------------------------------------------------------------------------
// get failed logins data
// --------------------------------------------------------------------------------------
//function get_failed_logins($scope, $http, username)
//{
//  $scope.failed_logins = [];
//
//  $scope.days.forEach(function (day, index) {
//    $http({
//      method  : 'GET',
//      url     : '/api/failed_logins/?timestamp=' + day + "&username=" + username
//    })
//    .then(function(response) {
//      // config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
//      //var timestamp = response.config.url.split("?")[1].split("&")[0].split("=")[1];
//      var timestamp = response.config.url.split("?")[1].split("&")[0].split("=")[1];
//      var dict = {};
//      dict[timestamp] = response.data.length;
//      $scope.failed_logins.push(dict);
//    });
//  });
//}
// --------------------------------------------------------------------------------------
// get all days between min and max
// --------------------------------------------------------------------------------------
//function get_days($scope, $http)
//{
//  // TODO - fix db data UTC offset
//  // TODO - fix iteration when overcoming DST
//
//  $scope.days = [];
//
//  var min = new Date($scope.db_data.failed_logins.min); // same for all collections
//  var max = new Date($scope.db_data.failed_logins.max); // same for all collections
//
//  // iterate from min to max by days
//  for(var i = min; i < max; i.setTime(i.getTime() + 86400000)) {
//    $scope.days.push(i.toISOString().replace(/T.*$/, ''));
//  }
//}
// --------------------------------------------------------------------------------------
// get min and max timestamp for all db collection
// --------------------------------------------------------------------------------------
function get_min_max($scope, $http, callback)
{
  $http({
    method  : 'GET',
    url     : '/api/db_data'
  })
  .then(function(response) {
    $scope.db_data = response.data; // get realm list
    callback();
  });
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function construct_query_string_search(form_data)
{
  qs = "?"

  // ================================ 
  // query string construction
  // add each one separately - timestamp could cause problems - see below
  if(form_data.username)
    qs += "username=" + form_data.username;

  if(form_data.mac_address)
    if(qs.length == 0)
      qs += "mac_address=" + form_data.mac_address;
    else
      qs += "&" + "mac_address=" + form_data.mac_address;

  if(form_data.result)
    if(qs.length == 0)
      qs += "result=" + form_data.result;
    else
      qs += "&" + "result=" + form_data.result;

  // ================================ 
  // timestamp transformation logic
  if(form_data.min_date) {  // transform to greater or queal
    if(qs.length == 0)
      qs += "timestamp>=" + form_data.min_date.toISOString();
    else
      qs += "&" + "timestamp>=" + form_data.min_date.toISOString();
  }

  if(form_data.max_date) {  // transform to lower or queal
    if(qs.length == 0)
      qs += "timestamp<=" + form_data.max_date.toISOString();
    else
      qs += "&" + "timestamp<=" + form_data.max_date.toISOString();
  }

  return qs;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_legend_data(data)
{
// TODO
}
// --------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
function load_data($scope, callback)
{
  for(var item in $scope.heat_map) {
    callback($scope.heat_map[item]);
  }

  //callback($scope.heat_map[0]);
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// heat map func
// taken from http://bl.ocks.org/ianyfchang/8119685
// --------------------------------------------------------------------------------------
function heat_map($scope)
{
  var margin = { top: 150, right: 10, bottom: 150, left: 100 },
  //var margin = { top: 250, right: 50, bottom: 100, left: 150 },
    cellSize = 18;
    col_number = $scope.realms.length;
    row_number = $scope.realms.length;
    width = cellSize*col_number, // - margin.left - margin.right,
    height = cellSize*row_number , // - margin.top - margin.bottom,
    //gridSize = Math.floor(width / 24),
    legendElementWidth = cellSize * 2.5,
    colorBuckets = 21,
    //colors = ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];
    
    colors = [
    '#FFFFFF',
    '#F1EEF6',
    '#E6D3E1',
    '#DBB9CD',
    '#D19EB9',
    '#C684A4',
    '#BB6990',
    '#B14F7C',
    '#A63467',
    '#9B1A53',
    '#91003F',
    '#005824',
    '#20ED5A',
    '#EDD520',
    '#6AAB10',
    '#129BEA',
    '#06476C',
    '#45066C',
    '#8814D0',
    '#DF8C08',
    '#895E19'
    ];

    hcrow = [];
    hccol = [];
    for(var item in $scope.realms) {
      hcrow.push(Number(item) + 1);
      hccol.push(Number(item) + 1);
    }

    rowLabel = $scope.realms;
    colLabel = $scope.realms;

  d3.tsv("heat_map_test_data.tsv",
  function(d) {
    //console.log(d);
    return {
      row:   +d.row_idx,
      col:   +d.col_idx,
      value: +d.value
    };
  },
  function(error, data) {
    // debug
    //console.log(data);

    var colorScale = d3.scale.quantile()
        .domain([ 0, 300, 1000 ])
        .range(colors);
    
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width)
        .attr("height", height)
        ;
    var rowSortOrder=false;
    var colSortOrder=false;
    var rowLabels = svg.append("g")
        .selectAll(".rowLabelg")
        .data(rowLabel)
        .enter()
        .append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return hcrow.indexOf(i+1) * cellSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
        .attr("class", function (d,i) { return "rowLabel mono r"+i;} ) 
        .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
        .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
        .on("click", function(d,i) {rowSortOrder=!rowSortOrder; sortbylabel("r",i,rowSortOrder);d3.select("#order").property("selectedIndex", 4).node().focus();;})
        ;

    var colLabels = svg.append("g")
        .selectAll(".colLabelg")
        .data(colLabel)
        .enter()
        .append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return hccol.indexOf(i+1) * cellSize; })
        .style("text-anchor", "left")
        .attr("transform", "translate("+cellSize/2 + ",-6) rotate (-90)")
        .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
        .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
        .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
        .on("click", function(d,i) {colSortOrder=!colSortOrder;  sortbylabel("c",i,colSortOrder);d3.select("#order").property("selectedIndex", 4).node().focus();;})
        ;

    // ==========================================================
    //console.log(data);
    // ==========================================================

    var heatMap = svg.append("g").attr("class","g3")
          .selectAll(".cellg")
          .data(data,function(d){return d.row+":"+d.col;})
          .enter()
          .append("rect")
          .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
          .attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; })
          .attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
          .attr("width", cellSize)
          .attr("height", cellSize)
          .style("fill", function(d) { 
            // debug
            //console.log("val: " + d.value);
            //console.log(colorScale(d.value));

            return colorScale(d.value); })
          /* .on("click", function(d) {
                 var rowtext=d3.select(".r"+(d.row-1));
                 if(rowtext.classed("text-selected")==false){
                     rowtext.classed("text-selected",true);
                 }else{
                     rowtext.classed("text-selected",false);
                 }
          })*/
          .on("mouseover", function(d){
                 //highlight text
                 d3.select(this).classed("cell-hover",true);
                 d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.row-1);});
                 d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.col-1);});
          
                 //Update the tooltip position and value
                 d3.select("#tooltip")
                   .style("left", (d3.event.pageX+10) + "px")
                   .style("top", (d3.event.pageY-10) + "px")
                   .select("#value")
                   .text("lables:"+rowLabel[d.row-1]+","+colLabel[d.col-1]+"\ndata:"+d.value+"\nrow-col-idx:"+d.col+","+d.row+"\ncell-xy "+this.x.baseVal.value+", "+this.y.baseVal.value);  
                 //Show the tooltip
                 d3.select("#tooltip").classed("hidden", false);
          })
          .on("mouseout", function(){
                 d3.select(this).classed("cell-hover",false);
                 d3.selectAll(".rowLabel").classed("text-highlight",false);
                 d3.selectAll(".colLabel").classed("text-highlight",false);
                 d3.select("#tooltip").classed("hidden", true);
          })
          ;

    // ==========================================================


    //var svg_legend = d3.select("#legend").append("svg")
    //var legend = svg_legend.selectAll(".legend")  // TODO
    var legend = svg.selectAll(".legend")
        .data([0,5,10,25,50,75,100,150,200,250,300,1000,1500,2000,2500,3000,3500,4000,4500,5000,5500])
        //.data(get_legend_data(data))      // TODO
        .enter().append("g")
        .attr("class", "legend");
   
    legend.append("rect")
      .attr("x", function(d, i) { return legendElementWidth * i; })
      .attr("y", height+(cellSize*2))
      .attr("width", legendElementWidth)
      .attr("height", cellSize)
      .style("fill", function(d, i) { return colors[i]; });
   
    legend.append("text")
      .attr("class", "mono")
      .text(function(d) { return d; })
      .attr("width", legendElementWidth)
      .attr("x", function(d, i) { return legendElementWidth * i; })
      .attr("y", height + (cellSize*4));

  // Change ordering of cells

    //function sortbylabel(rORc,i,sortOrder){
    //     var t = svg.transition().duration(3000);
    //     var log2r=[];
    //     var sorted; // sorted is zero-based index
    //     d3.selectAll(".c"+rORc+i) 
    //       .filter(function(ce){
    //          log2r.push(ce.value);
    //        })
    //     ;
    //     if(rORc=="r"){ // sort log2ratio of a gene
    //       sorted=d3.range(col_number).sort(function(a,b){ if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
    //       t.selectAll(".cell")
    //         .attr("x", function(d) { return sorted.indexOf(d.col-1) * cellSize; })
    //         ;
    //       t.selectAll(".colLabel")
    //        .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; })
    //       ;
    //     }else{ // sort log2ratio of a contrast
    //       sorted=d3.range(row_number).sort(function(a,b){if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
    //       t.selectAll(".cell")
    //         .attr("y", function(d) { return sorted.indexOf(d.row-1) * cellSize; })
    //         ;
    //       t.selectAll(".rowLabel")
    //        .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; })
    //       ;
    //     }
    //}

    //d3.select("#order").on("change",function(){
    //  order(this.value);
    //});
    
    //function order(value){
    // if(value=="hclust"){
    //  var t = svg.transition().duration(3000);
    //  t.selectAll(".cell")
    //    .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
    //    .attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; })
    //    ;

    //  t.selectAll(".rowLabel")
    //    .attr("y", function (d, i) { return hcrow.indexOf(i+1) * cellSize; })
    //    ;

    //  t.selectAll(".colLabel")
    //    .attr("y", function (d, i) { return hccol.indexOf(i+1) * cellSize; })
    //    ;

    // }else if (value=="probecontrast"){
    //  var t = svg.transition().duration(3000);
    //  t.selectAll(".cell")
    //    .attr("x", function(d) { return (d.col - 1) * cellSize; })
    //    .attr("y", function(d) { return (d.row - 1) * cellSize; })
    //    ;

    //  t.selectAll(".rowLabel")
    //    .attr("y", function (d, i) { return i * cellSize; })
    //    ;

    //  t.selectAll(".colLabel")
    //    .attr("y", function (d, i) { return i * cellSize; })
    //    ;

    // }else if (value=="probe"){
    //  var t = svg.transition().duration(3000);
    //  t.selectAll(".cell")
    //    .attr("y", function(d) { return (d.row - 1) * cellSize; })
    //    ;

    //  t.selectAll(".rowLabel")
    //    .attr("y", function (d, i) { return i * cellSize; })
    //    ;
    // }else if (value=="contrast"){
    //  var t = svg.transition().duration(3000);
    //  t.selectAll(".cell")
    //    .attr("x", function(d) { return (d.col - 1) * cellSize; })
    //    ;
    //  t.selectAll(".colLabel")
    //    .attr("y", function (d, i) { return i * cellSize; })
    //    ;
    // }
    //}
    // 
    var sa=d3.select(".g3")
        .on("mousedown", function() {
            if( !d3.event.altKey) {
               d3.selectAll(".cell-selected").classed("cell-selected",false);
               d3.selectAll(".rowLabel").classed("text-selected",false);
               d3.selectAll(".colLabel").classed("text-selected",false);
            }
           var p = d3.mouse(this);
           sa.append("rect")
           .attr({
               rx      : 0,
               ry      : 0,
               class   : "selection",
               x       : p[0],
               y       : p[1],
               width   : 1,
               height  : 1
           })
        })
        .on("mousemove", function() {
           var s = sa.select("rect.selection");
        
           if(!s.empty()) {
               var p = d3.mouse(this),
                   d = {
                       x       : parseInt(s.attr("x"), 10),
                       y       : parseInt(s.attr("y"), 10),
                       width   : parseInt(s.attr("width"), 10),
                       height  : parseInt(s.attr("height"), 10)
                   },
                   move = {
                       x : p[0] - d.x,
                       y : p[1] - d.y
                   }
               ;
        
               if(move.x < 1 || (move.x*2<d.width)) {
                   d.x = p[0];
                   d.width -= move.x;
               } else {
                   d.width = move.x;       
               }
        
               if(move.y < 1 || (move.y*2<d.height)) {
                   d.y = p[1];
                   d.height -= move.y;
               } else {
                   d.height = move.y;       
               }
               s.attr(d);
        
                   // deselect all temporary selected state objects
               d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
               d3.selectAll(".text-selection.text-selected").classed("text-selected",false);

               d3.selectAll('.cell').filter(function(cell_d, i) {
                   if(
                       !d3.select(this).classed("cell-selected") && 
                           // inner circle inside selection frame
                       (this.x.baseVal.value)+cellSize >= d.x && (this.x.baseVal.value)<=d.x+d.width && 
                       (this.y.baseVal.value)+cellSize >= d.y && (this.y.baseVal.value)<=d.y+d.height
                   ) {
        
                       d3.select(this)
                       .classed("cell-selection", true)
                       .classed("cell-selected", true);

                       d3.select(".r"+(cell_d.row-1))
                       .classed("text-selection",true)
                       .classed("text-selected",true);

                       d3.select(".c"+(cell_d.col-1))
                       .classed("text-selection",true)
                       .classed("text-selected",true);
                   }
               });
           }
        })
        .on("mouseup", function() {
              // remove selection frame
           sa.selectAll("rect.selection").remove();
        
               // remove temporary selection marker class
           d3.selectAll('.cell-selection').classed("cell-selection", false);
           d3.selectAll(".text-selection").classed("text-selection",false);
        })
        .on("mouseout", function() {
           if(d3.event.relatedTarget.tagName=='html') {
                   // remove selection frame
               sa.selectAll("rect.selection").remove();
                   // remove temporary selection marker class
               d3.selectAll('.cell-selection').classed("cell-selection", false);
               d3.selectAll(".rowLabel").classed("text-selected",false);
               d3.selectAll(".colLabel").classed("text-selected",false);
           }
        })
        ;
  });
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('graph_test_2_controller', ['$scope', '$http', function ($scope, $http) {
  get_realms($scope, $http);  
  get_min_max($scope, $http, function() {
    get_days($scope, $http);        // no callback needed here
      get_heat_map_data($scope, $http, function($scope) {
        
        var options = {
          tooltipTemplate: "<%= xLabel %> | <%= yLabel %> : <%= value %>",
          responsive: false
        };

        $http({
          method  : 'GET',
          url     : '/heat_data3'
        })
        .then(function(response) {
          //console.log(response.data);       // TODO - v tomto miste je nejak moc dat ... 
          //var data = {};
          //data.labels = $scope.realms;

          var ctx = document.getElementById('heatmap').getContext('2d');
          var newChart = new Chart(ctx).HeatMap(response.data, options);
        });
      });
  });
}]);
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function transform_data(input, output, realms, callback)
{
  for(var item in input) {  // iterate all input data
    var dict = {};
    dict.label = input[item].realm;
    dict.data = [];
    
    for(var realm in realms) {      // iterate all realms - all data must be defined

      for(var sub in input[item].institutions) {    // iterate all insitutions for current realm
        var val = 0;

        if(input[item].institutions[sub].realm == realms[realm])
          val = input[item].institutions[sub].count;

        dict.data.push(val);    // 0 or count
      }
    }
    output.datasets.push(dict);
  }

  callback(output);
}
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('graph_test_3_controller', ['$scope', '$http', function ($scope, $http) {
  var svg = d3.select("svg"),
      margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var parseTime = d3.timeParse("%Y-%m-%d");

  var x = d3.scaleTime()
      .rangeRound([0, width]);

  var y = d3.scaleLinear()
      .rangeRound([height, 0]);

  var line = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); });

  d3.tsv("line1.tsv", function(d) {
    d.date = parseTime(d.date);
    d.close = +d.close;
    return d;
  }, function(error, data) {
    if (error) throw error;

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.close; }));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
      .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text("počet neúspěšných přihlášení");

    g.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
  });
}]);
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
}]);
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
  $scope.submit = function () {
    add_options($scope);        // add optional form fields
    $scope.base_qs = build_qs($scope.form_data, form_items);  // create query string
    $scope.qs = $scope.base_qs;
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.get_page($http, $scope.paging.current_page, data_func);
    $scope.submitted = true;
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
  $scope.submit = function () {
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
  // setup
  var calendars = document.getElementsByClassName("flatpickr").flatpickr({
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
    minDate: $scope.db_data.mac_count.min   // min from db
  });

  // flatpickr should be able to automatically set default date by code below
  // but it is not working at the moment
  //flatpickr("#min_date", {
  //  defaultDate: 1477697199863
  //});

  // alternative hand solution
  var min_date = document.getElementById("min_date");
  var next = min_date.nextElementSibling;
  next.setAttribute("value", $scope.form_data.min_date);

  var max_date = document.getElementById("max_date");
  var next = max_date.nextElementSibling;
  next.setAttribute("value", $scope.form_data.max_date);
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
function graph($scope)
{
  // taken from
  // https://bl.ocks.org/d3noob/bdf28027e0ce70bd132edc64f1dd7ea4
  // http://bl.ocks.org/Caged/6476579
  // http://bl.ocks.org/biovisualize/5372077

  // http://stackoverflow.com/questions/21639305/d3js-take-data-from-an-array-instead-of-a-file
  // ============================================================================

  // set the dimensions and margins of the graph
  var margin = {top: 40, right: 20, bottom: 100, left: 80};
  var col_length = 40;  // column length
  
  // dynamically determine graph width by size of data
  var width = $scope.graph_data.length * col_length - margin.left - margin.right;
  var height = 520 - margin.top - margin.bottom;
  var data = $scope.graph_data;

  // ensure minimal width
  var min_width = 200;

  if(width < min_width)
    width = min_width;

  // ensure maximal width
  var max_width = 800;

  if(width > max_width)
    width = max_width;

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
    .style("font-size", "16px") 
    .style("text-decoration", "underline")  
    .text($scope.graph_title);


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
    }
    ok_count : {
      val : "",
      sel : "eq",
      types : [ "eq", "gt", "lt" ],
      type_names : [ "je roven", "je větší", "je menší" ]
    }
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


  // TODO - pokud nebudou zadne parametry, mohlo by byt rovnou predpocitano


  $scope.days.forEach(function (day, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/failed_logins/' + qs + ts + day     // TODO - limit on fields to speed up ?
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
function test_graph_mult()
{

  // Tutorial: http://frameworkish.com/html/2016/05/04/grouped-dynamic-bar-chart-d3.html
  var data = [
    {
      state: 'CA',
      stats: [2704659,4499890,2159981,3853788,10604510,8819342,4114496]
    },
    {
      state: 'TX',
      stats: [2027307,3277946,1420518,2454721,7017731,5656528,2472223]
    },
    {
      state: 'NY',
      stats: [1208495,2141490,1058031,1999120,5355235,5120254,2607672]
    },
    {
      state: 'FL',
      stats: [1140516,1938695,925060,1607297,4782119,4746856,3187797]
    },
    {
      state: 'IL',
      stats: [894368,1558919,725973,1311479,3596343,3239173,1575308]
    },
    {
      state: 'IL',
      stats: [737462,1345341,679201,1203944,3157759,3414001,1910571]
    }
  ];

  var ids = ['preeschol', 'gradeschooler', 'teen', 'youngAdult', 'adult', 'middleAge', 'retired'];
  var ageNames = ['Under 5 Years', '5 to 13 Years', '14 to 17 years', '18 to 24 years', '25 to 44 Years', '45 to 64 Years', '65 Years and Over'];

  // Let's populate the categoeries checkboxes
  d3.select('.categories').selectAll('.checkbox')
    .data(ids)
    .enter()
    .append('div')
    .attr('class', 'checkbox')
    .append('label').html(function(id, index) {
      var checkbox = '<input id="' + id + '" type="checkbox" class="category">';
      return checkbox + ageNames[index];
    });

  // some variables declarations
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  // the scale for the state age value
  var x = d3.scale.linear().range([0, width]);

  // the scale for each state
  var y0 = d3.scale.ordinal().rangeBands([0, height], .1);
  // the scale for each state age
  var y1 = d3.scale.ordinal();

  // just a simple scale of colors
  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  //
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickFormat(d3.format(".2s"));

  var yAxis = d3.svg.axis()
      .scale(y0)
      .orient("left");

  var svg = d3.select(".graph").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.select('.categories').selectAll('.category').on('change', function() {
    var x = d3.select('.categories').selectAll('.category:checked');
    var ids = x[0].map(function(category) {
      return category.id;
    });
    updateGraph(ids);
  });
  renderGraph();

  function renderGraph() {
    x.domain([0, 0]);
    // y0 domain is all the state names
    y0.domain(data.map(function(d) { return d.state; }));
    // y1 domain is all the age names, we limit the range to from 0 to a y0 band
    y1.domain(ageNames).rangeRoundBands([0, y0.rangeBand()]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
  }

  function updateGraph(selectedIds) {

    var statesData = data.map(function(stateData) {
      return {
        state: stateData.state,
        ages: selectedIds.map(function(selectedId) {
          var index = ids.findIndex(function(id) {
            return selectedId === id;
          });
          return {
            id: ids[index],
            name: ageNames[index],
            value: stateData.stats[index]
          };
        })
      }
    });


    // x domain is between 0 and the maximun value in any ages.value
    x.domain([0, d3.max(statesData, function(d) { return d3.max(d.ages, function(d) { return d.value }); })]);
    // y0 domain is all the state names
    y0.domain(statesData.map(function(d) { return d.state; }));
    // y1 domain is all the age names, we limit the range to from 0 to a y0 band
    y1.domain(ids).rangeRoundBands([0, y0.rangeBand()]);

    svg.selectAll('.axis.x').call(xAxis);
    svg.selectAll('.axis.y').call(yAxis);

    var state = svg.selectAll(".state")
      .data(statesData);

    state.enter().append("g")
      .attr("class", "state")
      .attr("transform", function(d) { return "translate(0, " + y0(d.state) + ")"; });

    var age = state.selectAll("rect")
      .data(function(d) { return d.ages; });

    // we append a new rect every time we have an extra data vs dom element
    age.enter().append("rect")
      .attr('width', 0);

    // this updates will happend neither inserting new elements or updating them
    age
      .attr("x", 0)
      .attr("y", function(d, index) { return y1(ids[index]); })
      .attr("id", function(d) { return d.id; })
      .style("fill", function(d) { return color(d.name); })
      .text(function(d) { return d.name })
      .transition()
      .attr("width", function(d) { return x(d.value); })
      .attr("height", y1.rangeBand());

    age.exit().transition().attr("width", 0).remove();

    // legend   ==========================================================

    var legend = svg.selectAll(".legend")
        .data(statesData[0].ages.map(function(age) { return age.name; }));

    legend.enter().append("g");
    legend
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + (200 + i * 20) + ")"; });

    var legendColor = legend.selectAll('.legend-color').data(function(d) { return [d]; });
    legendColor.enter().append("rect");
    legendColor
      .attr('class', 'legend-color')
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    var legendText = legend.selectAll('.legend-text').data(function(d) { return [d]; });;

    legendText.enter().append("text");
    legendText
      .attr('class', 'legend-text')
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

    legend.exit().remove();
  }
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
    }
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
  init($scope, $http);
  //addiational_fields_roaming_most($scope);   // set up additional form fields
  $scope.graph_title = "aktivita eduroamu";
  $scope.title = "etlog: aktivita eduroamu";
  //handle_submit($scope, $http, $q, get_roaming, graph, []);
}]);
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_roaming($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.graph_data = [];

  var ts = "timestamp=";    // timestamp

  // TODO

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
angular.module('etlog').controller('roaming_most_used_test_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
    inst_count : 25
  };
  $scope.graph_title = "Nejvíce využívaný roaming";
  $scope.title = "etlog: organizace nejvíce využívající roaming";
  init_calendar($scope, $http);
  set_calendar_opts($scope);
  handle_common_submit($scope, $http, $q, get_roaming_most_used_count, graph, "roaming_most_used", "used_count");
  handle_download($scope);
}]);
// --------------------------------------------------------------------------------------
// initialize calendars
// --------------------------------------------------------------------------------------
function init_calendar($scope, $http)
{
  $scope.submitted = false; // form has not been submitted yet
  
  // setup
  // no min set
  var calendars = document.getElementsByClassName("flatpickr").flatpickr({
    altInputClass : "form-control",
    altInput: true,
    altFormat: "d.m.Y",
    maxDate: new Date(),                    // today
  });

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
  $scope.submit = function () {
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
  // flatpickr should be able to automatically set default date by code below
  // but it is not working at the moment
  //flatpickr("#min_date", {
  //  defaultDate: 1477697199863
  //});

  // alternative hand solution
  var min_date = document.getElementById("min_date");
  var next = min_date.nextElementSibling;
  next.setAttribute("value", $scope.form_data.min_date.split("-")[2] + "." + $scope.form_data.min_date.split("-")[1] + "." + $scope.form_data.min_date.split("-")[0]);

  var max_date = document.getElementById("max_date");
  var next = max_date.nextElementSibling;
  next.setAttribute("value", $scope.form_data.max_date.split("-")[2] + "." + $scope.form_data.max_date.split("-")[1] + "." + $scope.form_data.max_date.split("-")[0]);
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
// --------------------------------------------------------------------------------------
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




// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_most_provided_test_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.timestamp = "1 měsíc";       // one month
  $scope.timestamp_opts = [ "1 měsíc", "3 měsíce", "12 měsíců" ]; // 1, 3 or 12 months
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  $scope.form_data = {
    min_date : new Date(new Date() - 30 * 86400000).toISOString().replace(/T.*$/, ''),      // 30 days ago - %Y-%m-%d
    max_date : new Date().toISOString().replace(/T.*$/, ''),                                // today - %Y-%m-%d
    inst_count : 25
  };
  $scope.graph_title = "Nejvvíce poskytovaný roaming";
  $scope.title = "etlog: organizace nejvíce poskytující roaming";
  init_calendar($scope, $http);
  set_calendar_opts($scope);
  handle_common_submit($scope, $http, $q, get_roaming_most_provided_count, graph, "roaming_most_provided", "provided_count");
  handle_download($scope);
}]);
// --------------------------------------------------------------------------------------
function create_graph_data_provided($scope, data)
{
  for(var item in data) {
    $scope.graph_data.push({ timestamp : data[item].inst_name,     /// TODO ???
                       value : data[item].provided_count });
  }
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
function get_roaming_most_provided_count($scope, $http, qs, $q, callback)
{
  $scope.graph_data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  return $http({
    method  : 'GET',
    url     : '/api/roaming/most_provided' + qs + ts
  })
  .then(function(response) {
    $scope.table_data = response.data;
    create_graph_data_provided($scope, response.data);
    callback($scope);
  });
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('test_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  $scope.title = "etlog: testovací datepicker";
}]);
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
// TODO
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

  for(var item in data) {
    for(var key in keys) {
      if(text.length > 0 && text[text.length - 1] != "\n")   // continue
        text += "," + keys[key] + "," + data[item][keys[key]];

      else    // beginning of line
        text += keys[key] + "," + data[item][keys[key]];
    }
    text += "\n";
  }

  return text;
}
// --------------------------------------------------------------------------------------











