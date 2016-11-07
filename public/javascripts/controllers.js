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
function get_failed_logins($scope, $http, username)
{
  $scope.failed_logins = [];

  $scope.days.forEach(function (day, index) {
    $http({
      method  : 'GET',
      url     : '/api/failed_logins/?timestamp=' + day + "&username=" + username
    })
    .then(function(response) {
      // config.url : '/api/failed_logins/?timestamp=2016-11-01&username=/.*@cvut\.cz/'
      //var timestamp = response.config.url.split("?")[1].split("&")[0].split("=")[1];
      var timestamp = response.config.url.split("?")[1].split("&")[0].split("=")[1];
      var dict = {};
      dict[timestamp] = response.data.length;
      $scope.failed_logins.push(dict);
    });
  });
}
// --------------------------------------------------------------------------------------
// get all days between min and max
// --------------------------------------------------------------------------------------
function get_days($scope, $http)
{
  // TODO - fix db data UTC offset
  // TODO - fix iteration when overcoming DST

  $scope.days = [];

  var min = new Date($scope.db_data.failed_logins.min); // same for all collections
  var max = new Date($scope.db_data.failed_logins.max); // same for all collections

  // iterate from min to max by days
  for(var i = min; i < max; i.setTime(i.getTime() + 86400000)) {
    $scope.days.push(i.toISOString().replace(/T.*$/, ''));
  }
}
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
  var margin = { top: 150, right: 10, bottom: 50, left: 100 },
  //var margin = { top: 250, right: 50, bottom: 100, left: 150 },
    cellSize = 20;
    col_number = $scope.realms.length;
    row_number = $scope.realms.length;
    width = cellSize*col_number, // - margin.left - margin.right,
    height = cellSize*row_number , // - margin.top - margin.bottom,
    //gridSize = Math.floor(width / 24),
    legendElementWidth = cellSize * 2.5,
    colorBuckets = 21,
    colors = ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F'];

    // TODO
    //hcrow = [49,11,30,4,18,6,12,20,19,33,32,26,44,35,38,3,23,41,22,10,2,15,16,36,8,25,29,7,27,34,48,31,45,43,14,9,39,1,37,47,42,21,40,5,28,46,50,17,24,13], // change to gene name or probe id
    //hcrow = [ $scope.realms.length ];

    hcrow = [];
    hccol = [];
    for(var item in $scope.realms) {
      hcrow.push(Number(item) + 1);
      hccol.push(Number(item) + 1);
    }

    rowLabel = $scope.realms;
    colLabel = $scope.realms;

  //d3.tsv("data_heatmap.tsv",
  //function(d) {
  //  return {
  //    row:   +d.row_idx,
  //    col:   +d.col_idx,
  //    value: +d.log2ratio
  //  };
  //},

  // TODO ?
  //load_data($scope, function(elem) {
  //  for(var realm in elem.institutions) {   // iterate all institutions

  //  }
  //  console.log(elem.realm);
  //  
  //  //console.log(elem);
  //})


  d3.tsv("heat_map_test_data.tsv",
  function(d) {
    // debug
    //console.log(d);

    return {
      row:   +d.row_idx,
      col:   +d.col_idx,
      value: +d.value
    };
  },
  function(error, data) {
    var colorScale = d3.scale.quantile()
        .domain([ -10 , 0, 10])
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


    //var test = d3.select("#test").append("svg")
    //var heatMap = test.append("g").attr("class","g3")
    //      .selectAll(".cellg")
    //      .data(data, function(d){
    //        console.log(d);
    //        return d.row+":"+d.col;
    //      })
    //      console.log(heatMap);
          //.enter()
          //.append("rect")
          //.attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
          //.attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; })
          //.attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
          //.attr("width", cellSize)
          //.attr("height", cellSize)
          //.style("fill", function(d) { return colorScale(d.value); })

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
          .style("fill", function(d) { return colorScale(d.value); })
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

    var legend = svg.selectAll(".legend")
        .data([-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10])
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

    function sortbylabel(rORc,i,sortOrder){
         var t = svg.transition().duration(3000);
         var log2r=[];
         var sorted; // sorted is zero-based index
         d3.selectAll(".c"+rORc+i) 
           .filter(function(ce){
              log2r.push(ce.value);
            })
         ;
         if(rORc=="r"){ // sort log2ratio of a gene
           sorted=d3.range(col_number).sort(function(a,b){ if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
           t.selectAll(".cell")
             .attr("x", function(d) { return sorted.indexOf(d.col-1) * cellSize; })
             ;
           t.selectAll(".colLabel")
            .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; })
           ;
         }else{ // sort log2ratio of a contrast
           sorted=d3.range(row_number).sort(function(a,b){if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
           t.selectAll(".cell")
             .attr("y", function(d) { return sorted.indexOf(d.row-1) * cellSize; })
             ;
           t.selectAll(".rowLabel")
            .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; })
           ;
         }
    }

    d3.select("#order").on("change",function(){
      order(this.value);
    });
    
    function order(value){
     if(value=="hclust"){
      var t = svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
        .attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; })
        ;

      t.selectAll(".rowLabel")
        .attr("y", function (d, i) { return hcrow.indexOf(i+1) * cellSize; })
        ;

      t.selectAll(".colLabel")
        .attr("y", function (d, i) { return hccol.indexOf(i+1) * cellSize; })
        ;

     }else if (value=="probecontrast"){
      var t = svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("x", function(d) { return (d.col - 1) * cellSize; })
        .attr("y", function(d) { return (d.row - 1) * cellSize; })
        ;

      t.selectAll(".rowLabel")
        .attr("y", function (d, i) { return i * cellSize; })
        ;

      t.selectAll(".colLabel")
        .attr("y", function (d, i) { return i * cellSize; })
        ;

     }else if (value=="probe"){
      var t = svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("y", function(d) { return (d.row - 1) * cellSize; })
        ;

      t.selectAll(".rowLabel")
        .attr("y", function (d, i) { return i * cellSize; })
        ;
     }else if (value=="contrast"){
      var t = svg.transition().duration(3000);
      t.selectAll(".cell")
        .attr("x", function(d) { return (d.col - 1) * cellSize; })
        ;
      t.selectAll(".colLabel")
        .attr("y", function (d, i) { return i * cellSize; })
        ;
     }
    }
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




