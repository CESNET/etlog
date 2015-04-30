$(document).ready(function(){
 
// ----------------------------------------------
 
    $("#search").click(function(){
      // TODO - validace spravnych hodnot
 
      var username = $("#username").val();
      var mac = $("#mac_address").val();
      var result = $("#auth_result").val();
      var url = "";
 
// ----------------------------------------------

      if(username != "")
        url = "/users/" + username;
      
      if(mac != "")
        url = url + "/mac/" + mac;

      if(result != "")
        url = url + "/results/" + result;

// ----------------------------------------------

      console.log("url: " + url);
      $("#results_h")[0].innerHTML = "";
      $("#results")[0].innerHTML = "";
      
// ----------------------------------------------

      $.ajax({
        url: url,
        success: function(json){
        },
        complete: function(json){
          //console.log(json);
          
          if(json.responseText == "[]") {
            $("#results_h")[0].innerHTML = "Zadaným parametrům vyhledávání neodpovídají žádné záznamy";
          }
          else {
            $("#results_h")[0].innerHTML = "Nalezené záznamy";
            $("#results")[0].innerHTML = json.responseText;
          }
        }
      });
    });

// ----------------------------------------------
    // TODO - rozdelit na search.js a roaming.js ?


    $("#roaming").click(function(){
      $.ajax({
        url: "/roaming/",
        success: function(json){
        },
        complete: function(json){
          //console.log(json);
          
          if(json.responseText == "[]") {
            $("#results_h")[0].innerHTML = "Zadaným parametrům vyhledávání neodpovídají žádné záznamy";
          }
          else {
            $("#results_h")[0].innerHTML = "Nalezené záznamy";
            $("#results")[0].innerHTML = json.responseText;
          }
        }
      });

    });

});

