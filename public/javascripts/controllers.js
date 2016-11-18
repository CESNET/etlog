// --------------------------------------------------------------------------------------
angular.module('etlog').controller('index_controller', ['$scope', '$http', function ($scope, $http) {
}]);
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('search_controller', ['$scope', '$http', function ($scope, $http) {
    //// create a blank object to hold our form information
    //// $scope will allow this to pass between controller and view
    
    $scope.message = "initial state";
    $scope.submit = function () {
      qs = construct_query_string_search($scope.form_data);
      console.log(qs);
      console.log($scope.form_data);

      $http({
        method  : 'GET',
        url     : '/api/search' + qs
        //params    : $scope.form_data,  // send form data
      })
      .then(function(response) {
        // TODO
        //console.log(data);
        //console.log(status);
        //console.log(headers);
        //console.log(config);


        //if (!data.success) {
        //  //// if not successful, bind errors to error variables
        //  //$scope.error_username = data.errors.username;
        //  //$scope.error_mac_address = data.errors.mac_address;
        //  //$scope.error_result = data.errors.result;
        //  console.log(data);
        //} else {
        //  // if successful, bind success message to message
        //  $scope.message = data.message;
        //}
        $scope.message = response.data;
      });
    }
}]);
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('mac_controller', ['$scope', '$http', function ($scope, $http) {
}]);
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('failed_logins_controller', ['$scope', '$http', function ($scope, $http) {
}]);
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_most_provided_controller', ['$scope', '$http', function ($scope, $http) {
}]);
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('roaming_most_used_controller', ['$scope', '$http', function ($scope, $http) {
}]);
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
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('mac_count_table_controller', ['$scope', '$http', function ($scope, $http) {
  // table controller "template"
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
  $scope.page_sizes = [ 10, 20, 50, 100 ];
  handle_table_submit($scope, $http, get_mac_count, $scope.paging, [ "username", "count" ], "mac_count");
  handle_pagination($scope, $http, get_mac_count);
  setup_filters($scope, $http, "mac_count");
}]);
// --------------------------------------------------------------------------------------
// TODO
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

  $scope.filter = "";   // filter is empty
}
// --------------------------------------------------------------------------------------
// TODO
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
// TODO
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
    });
  }

  $scope.get_page = get_page;

// --------------------------------------------------------------------------------------
// add paging to query string
// params: 
// qs     - query string
// paging - paging information
// --------------------------------------------------------------------------------------
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
    // add radio selection to form data
    for(var item in $scope.options) {
      if($scope.form_data[$scope.options[item].key]) {
        $scope.form_data[$scope.options[item].key + "_sel"] = $scope.options[item].sel;
      }
    }
    
    $scope.base_qs = build_qs($scope.form_data, form_items);  // create query string
    $scope.qs = $scope.base_qs;
    get_total_items($scope, $http, coll_name);        // set number of total items for paging
    $scope.get_page($http, $scope.paging.current_page, data_func);
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
//  console.log("get_total_items: " + $scope.qs);

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

    // add radio selection to form data
    for(var item in $scope.options) {
      if($scope.form_data[$scope.options[item].key]) {
        $scope.form_data[$scope.options[item].key + "_sel"] = $scope.options[item].sel;
      }
    }
    
    //// TODO ?
    //get_days($scope);                           // get array of days in specified interval

    // TODO - toto dodelat - zmena v build_qs
    //qs = build_qs($scope.form_data, form_items);  // create query string
    
    //data_func($scope, $http, qs, $q, function ($scope) { // get data from api
    //  //console.log($scope.data);
    //  graph_func($scope);    // draw graph
    //});
  }
}
// --------------------------------------------------------------------------------------
// get mac count data
// --------------------------------------------------------------------------------------
function get_mac_count($scope, $http, qs, callback)
{
  $scope.data = [];
  var ts = "timestamp>=" + $scope.form_data.min_date + "&timestamp<" + $scope.form_data.max_date;   // timestamp

  //console.log("get_mac_count: " + $scope.qs);

  return $http({
    method  : 'GET',
    //url     : '/api/mac_count/' + qs + ts
    url     : '/api/mac_count/' + qs + ts + "&sort=-count"      // always sort by mac address count
  })
  .then(function(response) {
    $scope.data = response.data;
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
  $scope.options = [ 
    {
      key : "username",
      val : "uživatelské jméno",
      subopts : [ 
        { key: "eq",
          val : "přesně odpovídá" },
        { key : "like",
          val : "obsahuje" },
      ],
      sel : "eq",
      validation : "^.*$"
    },
    {
      key : "count",
      val : "počet",
      subopts : [ 
        { key : "eq",
          val : "je roven" },
        { key : "gt",
          val : "je větší" },
        { key : "lt",
          val : "je menší" },
      ],
      sel : "eq",
      validation : "\\d+"
    },
  ];

  $scope.add_options = function() {
    $scope.options_added = true;
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
  var width = $scope.data.length * col_length - margin.left - margin.right;
  var height = 520 - margin.top - margin.bottom;
  var data = $scope.data;

  // ensure minimal width
  var min_width = 200;

  if(width < min_width)
    width = min_width;

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
angular.module('etlog').controller('mac_count_graph_controller_test', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields($scope);   // set up additional form fields
  handle_submit_test($scope, $http, $q);
}]);
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
angular.module('etlog').controller('failed_logins_graph_controller', ['$scope', '$http', '$q', function ($scope, $http, $q) {
  init($scope, $http);
  addiational_fields_failed_logins($scope);   // set up additional form fields
  $scope.grouped = true;
  $scope.graph_title = "neúspěšná přihlášení";
  handle_submit($scope, $http, $q, get_failed_logins, graph, [ "username", "fail_count", "ok_count", "ratio" ]);
}]);
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function addiational_fields_failed_logins($scope)
{
  $scope.options_added = false;
  $scope.options = [ 
    {
      key : "username",
      val : "uživatelské jméno",
      subopts : [ 
        { key: "eq",
          val : "přesně odpovídá" },
        { key : "like",
          val : "obsahuje" },
      ],
      sel : "eq"
    },
    {
      key : "fail_count",
      val : "počet neúspěšných přihlášení",
      subopts : [ 
        { key : "eq",
          val : "je roven" },
        { key : "gt",
          val : "je větší" },
        { key : "lt",
          val : "je menší" },
      ],
      sel : "eq"
    },
    {
      key : "ok_count",
      val : "počet úspěšných přihlášení",
      subopts : [ 
        { key : "eq",
          val : "je roven" },
        { key : "gt",
          val : "je větší" },
        { key : "lt",
          val : "je menší" },
      ],
      sel : "eq"
    },
    {
      key : "ratio",
      val : "poměr",
      subopts : [ 
        { key : "eq",
          val : "je roven" },
        { key : "gt",
          val : "je větší" },
        { key : "lt",
          val : "je menší" },
      ],
      sel : "eq"
    },
  ];


  $scope.add_options = function() {
    $scope.options_added = true;
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
    if(data[items[item]] && data[items[item] + "_sel"]) {  // both defined

     if(data[items[item] + "_sel"] == "eq") {
       if(ret.length == 1)
         ret += items[item] + "=" + data[items[item]];
       else
         ret += "&" + items[item] + "=" + data[items[item]];
     }

     else if(data[items[item] + "_sel"] == "like") {
       if(ret.length == 1)
         ret += items[item] + "=/" + data[items[item]] + "/";   // TODO - escaping ?
       else
         ret += "&" + items[item] + "=/" + data[items[item]] + "/";   // TODO - escaping ?
     }

     else if(data[items[item] + "_sel"] == "gt") {
       if(ret.length == 1)
         ret += items[item] + ">" + data[items[item]];
       else
         ret += "&" + items[item] + ">" + data[items[item]];
     }

     else if(data[items[item] + "_sel"] == "lt") {
       if(ret.length == 1)
         ret += items[item] + "<" + data[items[item]];
       else
         ret += "&" + items[item] + "<" + data[items[item]];
     }
    }
  }

  if(ret.length > 1)
    ret += "&";

  return ret;       // returned value is '?' or '?.*&'
}
// --------------------------------------------------------------------------------------
// get mac count data
// --------------------------------------------------------------------------------------
function get_failed_logins($scope, $http, qs, $q, callback)
{
  var chain = $q.when();
  $scope.data = [];

  // TODO - prepsat
  // predany qs bude vzdy koncit & pokud je delsi nez 1 -- ('?')

  var ts = "timestamp=";    // timestamp
  if(qs.length != 1)
    ts = "&timestamp=";

  $scope.days.forEach(function (day, index) {
    chain = chain.then(function(){
      return $http({
        method  : 'GET',
        url     : '/api/failed_logins/' + qs + ts + day     // TODO - limit on fields to speed up ?
      })
      .then(function(response) {
        //// config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
        var ts;
        var arr = response.config.url.split("?")[1].split("&");

        for(var item in arr) {  // find timestamp in query string variables
          if(arr[item].indexOf("timestamp") != -1) {
            ts = arr[item].split("=")[1].split("-");
            break;
          }
        }
        
        ts = ts[2] + "." + ts[1] + "." + ts[0];     // czech format - eg 01.11.2016
        $scope.data.push({ timestamp : ts, 
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
angular.module('etlog').factory('Resource', ['$q', '$filter', '$timeout', '$http', function ($q, $filter, $timeout, $http) {

	//this would be the service to call your server, a standard bridge between your model an $http

	// the database (normally on your server)
	var randomsItems = [];

	//function createRandomItem(id) {
	//	var heroes = ['Batman', 'Superman', 'Robin', 'Thor', 'Hulk', 'Niki Larson', 'Stark', 'Bob Leponge'];
	//	return {
	//		id: id,
	//		username: heroes[Math.floor(Math.random() * 7)],
	//		age: Math.floor(Math.random() * 1000),
	//		saved: Math.floor(Math.random() * 10000)
	//	};

	//}

	//for (var i = 0; i < 1000; i++) {
	//	randomsItems.push(createRandomItem(i));
	//}


    function createRandomItems($http)
    {
      return $http({
        method  : 'GET',
        url     : '/api/mac_count/?timestamp=2016-10-07&count>5&sort=-count'
      })
      .then(function(response) {
        randomsItems = response.data;
        console.log(randomsItems);
      });
    }

    createRandomItems($http);


	//fake call to the server, normally this service would serialize table state to send it to the server (with query parameters for example) and parse the response
	//in our case, it actually performs the logic which would happened in the server
	function getPage(start, number, params) {

		var deferred = $q.defer();

		var filtered = params.search.predicateObject ? $filter('filter')(randomsItems, params.search.predicateObject) : randomsItems;

		if (params.sort.predicate) {
			filtered = $filter('orderBy')(filtered, params.sort.predicate, params.sort.reverse);
		}

		var result = filtered.slice(start, start + number);

		//$timeout(function () {
		//	//note, the server passes the information about the data set size
		//	deferred.resolve({
		//		data: result,
		//		numberOfPages: Math.ceil(filtered.length / number)
		//	});
		//}, 1500);
        
        deferred.resolve({
            data: result,
            numberOfPages: Math.ceil(filtered.length / number)
        })

		return deferred.promise;
	}
	
    return {
		getPage: getPage
	};
}]);
// --------------------------------------------------------------------------------------



