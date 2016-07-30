// --------------------------------------------------------------------------------------
function create_table_header(size, head)
{
  var header = $("#results")[0].createTHead();
  var row = header.insertRow(0);
  
  for(i = 0; i < size; i++) {
    var cell = row.insertCell(0);
    cell.innerHTML = head[i];
  }
}
// --------------------------------------------------------------------------------------
function create_table_body(json, size)
{
  var body = $("#results")[0].createTBody();
  
  var response = JSON.parse(json.responseText);
  var res_size = Object.keys(response).length;      // dict

  for(var key in response) {
    var row = body.insertRow(0);

    // username, count
    // username
    cell = row.insertCell(-1);
    cell.innerHTML = key;

    // count
    cell = row.insertCell(-1);
    cell.innerHTML = response[key];
  }
}
// --------------------------------------------------------------------------------------
function navbar()
{
  var roaming = { 
    'Organizace nejvíce poskytující roaming' : '/roaming', 
    'Organizace nejvíce využívající roaming' : '/inst_roaming'
  };

  for(var key in roaming) {
    if(key == selected) {
      document.getElementById("roaming").className = "active";
      break;
    }
  }
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
function search()
{
  //$("#myModal").modal('show');
  
  $("#results_h")[0].innerHTML = "";
  $("#results")[0].innerHTML = "";
  $("#results")[0].style.visibility = "hidden";
  
  $.ajax({
    type: 'post',
    url: "/roaming/search",
    dataType: "json",
    //data: input,
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
        var head = ["počet roamujících uživatelů", "název organizace"];
        var size = head.length;
        
        create_table_header(size, head);
        create_table_body(json, size);
      }
    }
  });
}
// --------------------------------------------------------------------------------------
$(document).ready(function(){
// --------------------------------------------------------------------------------------
  $("#results")[0].style.visibility = "hidden";
  navbar();
// --------------------------------------------------------------------------------------
    search();

  //  TODO - pridat nejake moznosti razeni

});


