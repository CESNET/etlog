$(document).ready(function(){
 
// ----------------------------------------------
// ----------------------------------------------
 
  $("#results")[0].style.visibility = "hidden";
// ----------------------------------------------
  /* search by enter key */
  $(document).keypress(function(e) {
    if(e.which == 13)    /* enter */
      $("#search").click();
  });

// ----------------------------------------------

  // display datetimepicker on click on date_from
  $("#date_from").datetimepicker({
      locale: 'cs',
      format: 'DD.MM.YYYY HH:mm'
    }).on('changeDate show update click', function(e) {
      $('#main_form').formValidation('revalidateField', 'date_from');
    });

  // display datetimepicker on click on date_to
  $("#date_to").datetimepicker({
      locale: 'cs',
      format: 'DD.MM.YYYY HH:mm'
    }).on('changeDate show update click', function(e) {
      $('#main_form').formValidation('revalidateField', 'date_to');
    });

// ----------------------------------------------
  $("#search").click(function(){
    // TODO - zakaz manualniho vstupu pro date_from, date_to ?
    // TODO - posun obrazku spravne vyplnene hodnoty pro data na spravnou pozici ?
    // TODO - spravna validace pri pridani retezce k datumu a kliknuti mimo -> zjistit, ktery event to je
    // TODO - razeni vyslednych dat podle vysledku autentizace
    // TODO - nastavit maximalni a minimalni data
    // TODO - nastavit implicitni zacatek a konec dne pro vyber datumu

    $("#myModal").modal('show');
    removeValidation();
    
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
        //$("#search")[0].disabled = false;
        addValidation();
        
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
function removeValidation()
{
 var username =  {
      validators: {
          username: {
          }
      }
  };

  var mac = {
      validators: {
          mac: {
          }
      }
  };
            
  var date =  {
      validators: {
          date: {
            format: 'MM\.DD\.YYYY hh:mm',
            message: 'Není platné datum.'
          }
      }
  };
  
  $('#main_form')
  .formValidation('removeField', 'username', username)
  .formValidation('removeField', 'mac_address', mac)
  .formValidation('removeField', 'date_from', date)
  .formValidation('removeField', 'date_to', date);
}
// --------------------------------------------------------------------------------------
function addValidation()
{
 var username =  {
      validators: {
          username: {
          }
      }
  };

  var mac = {
      validators: {
          mac: {
          }
      }
  };
            
  var date =  {
      validators: {
          date: {
            format: 'MM\.DD\.YYYY hh:mm',
            message: 'Není platné datum.'
          }
      }
  };

  $('#main_form')
  .formValidation('addField', 'username', username)
  .formValidation('addField', 'mac_address', mac)
  .formValidation('addField', 'date_from', date)
  .formValidation('addField', 'date_to', date);
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
  // input - 22.05.2015 19:46
  // output - 2015-05-22T19:45:27+02:00

  if(date == "")
    return;

  var parts = date.split("\.");
  var iso_date = parts[2].substring(0,4) + "-" + parts[1] + "-" + parts[0] + "T" + date.split(" ")[1] + ":00+02:00"; // iso 8601 format

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
            
            if(value === '')
              return true;    // empty address allowed as search parameter

            else if(parseMac(value) == "")
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
    // ==> automaticky delaji validatory
    // ale je problem zaroven se zakazanou validaci pri submitu

    $('#main_form').formValidation({
        framework: 'bootstrap',
        //button: {
        //    selector: '#none',      // do not validate whole form on submit
        //    disabled: 'disabled'
        //},
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
            },
            date_from: {
                validators: {
                    date: {
                      format: 'DD\.MM\.YYYY HH:mm',
                      message: 'Není platné datum.'
                    }
                }
            },
            date_to: {
                validators: {
                    date: {
                      format: 'DD\.MM\.YYYY HH:mm',
                      message: 'Není platné datum.'
                    }
                }
            }
        }
    });
});




