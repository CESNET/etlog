$(document).ready(function(){
 
// ----------------------------------------------
    $('.datetimepicker1').datetimepicker({
      locale: 'cs',
      //format: moment().format()
      //dayViewHeaderFormat: 'MMMM YYYY'
      keepInvalid: true
    });

// ----------------------------------------------
 
  $("#results")[0].style.visibility = "hidden";
// ----------------------------------------------
  //$("#mac_address")[0].oninput = function(){
  //  validateMac();
  //}

  /* search by enter key */
  $(document).keypress(function(e) {
    if(e.which == 13)    /* enter */
      $("#search").click();
  });

// ----------------------------------------------


// ----------------------------------------------
  $("#search").click(function(){
    // TODO - pridat signalizaci spravne vyplnenych hodnot
    // TODO - automaticke otevreni kalendare pri kliku na vstup date_from, date_to
    // TODO - zakaz manualniho vstupu pro date_from, date_to
    // TODO - po jednom vyhledani je vyhledavaci tlacitko ve stavu disabled - proc ?
    // TODO - po odeslani formulare jsou prazdna pole vyhodnocena jako true, proc jsou vyhodnovacovana?

    $("#myModal").modal('show');
    
    var input = {
      "username": $("#username").val(),
      "mac": parseMac($("#mac_address").val()),
      "result": $("#auth_result").val(),
      "from": convertDate($("#date_from").val()),
      "to": convertDate($("#date_to").val())
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
function parseMac(mac)
{
  var matcher = new RegExp("^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$", "i");
  var found = matcher.test(mac);

  if(found)
    return mac.replace(/:/g, '');
  
  matcher = new RegExp("^([0-9A-F]{2}[-]){5}([0-9A-F]{2})$", "i");
  found = matcher.test(mac);

  if(found)
    return mac.replace(/-/g, '');
  
  matcher = new RegExp("^([0-9A-F]{4}[\\.]){2}([0-9A-F]{4})$", "i");
  found = matcher.test(mac);
  
  if(found)
    return mac.replace(/\./g, '');

  matcher = new RegExp("^[0-9A-F]{12}$", "i");
  found = matcher.test(mac);

  if(found)
    return mac;
 
  return "";        // unspecified
}
// --------------------------------------------------------------------------------------
function convertDate(date)
{
  // output - 2015-05-22T19:45:27+02:00
  // input - 22.05.2015 19:46

  if(date == "")    // debug
    return;

  var parts = date.split("\.");
  var iso_date = parts[2].substring(0,4) + "-" + parts[1] + "-" + parts[0] + "T" + date.split(" ")[1] + ":00+02:00"; // iso 8601 format

  //console.log(Date.parse(iso_date));
  //console.log(iso_date);

  return Date.parse(iso_date);
}
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


// --------------------------------------------------------------------------------------
// taken from http://formvalidation.io
// --------------------------------------------------------------------------------------
// custom validation

 FormValidation.Validator.username = {
        validate: function(validator, $field, options) {
            var value = $field.val();
 
            if (value === '')
                return true;

            // TODO - jak muze vypadat username ? specialni znaky ve jmenu - tecky, .... ?

            var matcher = new RegExp("^[a-zA-Z0-9]+@([a-zA-Z]+\\.){1,}[a-zA-Z]+$", "i");
            var found = matcher.test(value);
            
            if(found)
                return true;

            return {
                valid: false,
                message: 'Není platné uživatelské jméno.'
            }
        }
    };
// --------------------------------------------------------------------------------------

 FormValidation.Validator.mac = {
        validate: function(validator, $field, options) {
            var value = $field.val();
 
            // TODO - prazdny input vraci chybu
            if(parseMac(value) == "")
              return {
                  valid: false,
                  message: 'Není platná mac adresa.'
              }

            return true;
        }
    };
// --------------------------------------------------------------------------------------

    // TODO - pridat nejakou logiku, ktera neumozni vyhledavat kdyz nebude zadan zadny klicovy vstup - mac/username ?
    // na urovni vyhledavani uz je vyreseno -> prazdne parametry hledani nevraceji nic
    // pripadne jeste zakazat vyhledavani, pokud je nejaky parametr neplatny?

    $('#main_form').formValidation({
        framework: 'bootstrap',
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            username: {
                validators: {
                    username: {
                    }
                }
            },
            mac_address: {
                validators: {
                    mac: {
                    }
                }
            }
        }
    });
});




