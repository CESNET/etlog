$(document).ready(function(){
 
// ----------------------------------------------
 
  $("#results")[0].style.visibility = "hidden";
// ----------------------------------------------
  $("#mac_address")[0].oninput = function(){
    validateMac();
  }

// ----------------------------------------------
  $("#search").click(function(){
    overlay();
    
    var input = {
      "username": $("#username").val(),
      "mac": parseMac(),
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
        overlay();
        
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
  // <label for="company_shipping" class="error valid">OK!</label>
  
  if($("#mac_address").val() == "")
    $("#mac_address")[0].style.backgroundColor = "yellow";
  else if(parseMac() != "")
    $("#mac_address")[0].style.backgroundColor = "green";
  else
    $("#mac_address")[0].style.backgroundColor = "red";
}
// --------------------------------------------------------------------------------------
// OVERLAY
// taken from http://tympanus.net/codrops/2014/02/06/fullscreen-overlay-effects/
  ( function( window ) {

  'use strict';

  // class helper functions from bonzo https://github.com/ded/bonzo

  function classReg( className ) {
    return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
  }

  // classList support for class management
  // altho to be fair, the api sucks because it won't accept multiple classes at once
  var hasClass, addClass, removeClass;

  if ( 'classList' in document.documentElement ) {
    hasClass = function( elem, c ) {
      return elem.classList.contains( c );
    };
    addClass = function( elem, c ) {
      elem.classList.add( c );
    };
    removeClass = function( elem, c ) {
      elem.classList.remove( c );
    };
  }
  else {
    hasClass = function( elem, c ) {
      return classReg( c ).test( elem.className );
    };
    addClass = function( elem, c ) {
      if ( !hasClass( elem, c ) ) {
        elem.className = elem.className + ' ' + c;
      }
    };
    removeClass = function( elem, c ) {
      elem.className = elem.className.replace( classReg( c ), ' ' );
    };
  }

  function toggleClass( elem, c ) {
    var fn = hasClass( elem, c ) ? removeClass : addClass;
    fn( elem, c );
  }

  var classie = {
    // full names
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    // short names
    has: hasClass,
    add: addClass,
    remove: removeClass,
    toggle: toggleClass
  };

  // transport
  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( classie );
  } else {
    // browser global
    window.classie = classie;
  }
  })( window );
// --------------------------------------------------------------------------------------
  function overlay() 
  {
    var overlay = document.querySelector( 'div.overlay' ),
    transEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'msTransition': 'MSTransitionEnd',
        'transition': 'transitionend'
    },
    transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
    support = { transitions : Modernizr.csstransitions };

    function toggleOverlay() {
        if( classie.has( overlay, 'open' ) ) {
            classie.remove( overlay, 'open' );
            classie.add( overlay, 'close' );
            var onEndTransitionFn = function( ev ) {
                if( support.transitions ) {
                    if( ev.propertyName !== 'visibility' ) return;
                    this.removeEventListener( transEndEventName, onEndTransitionFn );
                }
                classie.remove( overlay, 'close' );
            };
            if( support.transitions ) {
                overlay.addEventListener( transEndEventName, onEndTransitionFn );
            }
            else {
                onEndTransitionFn();
            }
        }
        else if( !classie.has( overlay, 'close' ) ) {
            classie.add( overlay, 'open' );
        }
    }
      
    toggleOverlay();
  }
// END OVERLAY
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







