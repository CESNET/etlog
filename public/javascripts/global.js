$(document).ready(function(){
 
// ----------------------------------------------
    $('.datetimepicker1').datetimepicker({
      locale: 'cs'
    });

// ----------------------------------------------
 
  $("#results")[0].style.visibility = "hidden";
// ----------------------------------------------
/*
  $("#mac_address")[0].oninput = function(){
    validateMac();
  }
  */  

  /* search by enter key */
  $(document).keypress(function(e) {
    if(e.which == 13)    /* enter */
      $("#search").click();
  });



// ----------------------------------------------
  $("#search").click(function(){
    // TODO - pridat signalizaci spravne vyplnenych hodnot
    // TODO - automaticke otevreni kalendare pri kliku na vstup date_from, date_to
    // TODO - zakaz manualniho vstupu pro date_from, date_to

    //overlay();
    $("#myModal").modal('show');
    
    var input = {
      "username": $("#username").val(),
      "mac": parseMac(),
      "result": $("#auth_result").val(),
      "from": $("#date_from").val(),
      "to": $("#date_to").val()
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
        $("#myModal").modal('hide');
        //overlay();
        
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
function parseMac()
{
  var mac = $("#mac_address").val();
  var matcher = new RegExp("^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$", "i");
  var found = matcher.test(mac);

  if(found)
    return mac.replace(/:/g, '');
  
  matcher = new RegExp("^([0-9A-F]{4}[-]){2}([0-9A-F]{4})$", "i");
  found = matcher.test(mac);

  if(found)
    return mac.replace(/-/g, '');

  matcher = new RegExp("^[0-9A-F]{12}$", "i");
  found = matcher.test(mac);

  if(found)
    return mac;
 
  return "";        // unspecified
}
// --------------------------------------------------------------------------------------
function validateMac()
{
  if($("#mac_address").val() == "")
    $("#mac_address_form")[0].className = "";
  else if(parseMac() != "")
    $("#mac_address_form")[0].className = ".has-success.has-feedback";
  else
    $("#mac_address_form")[0].className = ".has-error.has-feedback";
}
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

