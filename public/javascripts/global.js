$(document).ready(function(){
 
// ----------------------------------------------
 
    $("#results")[0].style.visibility = "hidden";

// ----------------------------------------------

    $("#search").click(function(){
      // TODO - validace spravnych hodnot
      // TODO - vstup mac adresy v ruznych formatech
 
      var input = {
        "username": $("#username").val(),
        "mac": $("#mac_address").val(),
        "result": $("#auth_result").val()
      };
 
      $("#results_h")[0].innerHTML = "";
      $("#results")[0].innerHTML = "";
      $("#results")[0].style.visibility = "hidden";
      
// ----------------------------------------------

      $.ajax({
        type: 'post',
        url: "/search",
        dataType: "json",
        data: input,
        success: function(json){
        },
        complete: function(json){
          if(json.responseText == "[]") {
            $("#results_h")[0].innerHTML = "Zadaným parametrům vyhledávání neodpovídají žádné záznamy";
          }
          else {
            $("#results_h")[0].innerHTML = "Nalezené záznamy";
            document.getElementById("results").style.visibility = "visible";
            
            // table setup
            // reversed order
            var head = ["výsledek autentizace", "uživatelské jméno", "mac adresa", "navštívená instituce", "navštívená země", "realm", "timestamp"];
            var attributes = ["result", "pn", "csi", "visinst", "viscountry", "realm", "timestamp"];
            var size = attributes.length;
            
            createTableHeader(size, head);
            createTableBody(json, attributes, size);
          }
        }
      });
    });
// --------------------------------------------------------------------------------------
function createTableHeader(size, head)
{
  var header = $("#results")[0].createTHead();
  var row = header.insertRow(0);
  
  for(i = 0; i < size; i++) {
    var cell = row.insertCell(0);
    cell.innerHTML = head[i];
  }
}
// --------------------------------------------------------------------------------------
function createTableBody(json, attributes, size)
{
  var body = $("#results")[0].createTBody();
  //var j = 0;
  
  var response = JSON.parse(json.responseText);
  var res_size = response.length;

  for(i = 0; i < res_size; i++) {
    var row = body.insertRow(0);

    for(j = size; j > 0; j--) {
      cell = row.insertCell(-1);
      cell.innerHTML = response[i][attributes[j - 1]];
    }

    cell.className = cell.innerHTML;  // set class for last column - for coloring
  }
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
 
    // TODO - rozdelit na search.js a roaming.js ?


    //$("#roaming").click(function(){
    //  $.ajax({
    //    url: "/roaming/",
    //    success: function(json){
    //    },
    //    complete: function(json){
    //      //console.log(json);
    //      
    //      if(json.responseText == "[]") {
    //        $("#results_h")[0].innerHTML = "Zadaným parametrům vyhledávání neodpovídají žádné záznamy";
    //      }
    //      else {
    //        $("#results_h")[0].innerHTML = "Nalezené záznamy";
    //        $("#results")[0].innerHTML = json.responseText;
    //      }
    //    }
    //  });
    //});

});

