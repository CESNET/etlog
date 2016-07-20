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
function search()
{
  //$("#myModal").modal('show');
  
  var input = {
    "percent": $("#percent").val(),
  };

  $("#results_h")[0].innerHTML = "";
  $("#results")[0].innerHTML = "";
  $("#results")[0].style.visibility = "hidden";
  
  $.ajax({
    type: 'post',
    url: "/failed_logins_search",
    dataType: "json",
    data: input,
    success: function(json){
    },
    complete: function(json){
      //$("#myModal").modal('hide');
      
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
}
// --------------------------------------------------------------------------------------
$(document).ready(function(){
 
// --------------------------------------------------------------------------------------
 
  $("#results")[0].style.visibility = "hidden";
// --------------------------------------------------------------------------------------
  /* search by enter key */
  $(document).keypress(function(e) {
    if(e.which == 13)    /* enter */
      $("#failed_logins_search").click();
  });

// --------------------------------------------------------------------------------------
  $("#failed_logins_search").click(function(){
    search();
  });


});


