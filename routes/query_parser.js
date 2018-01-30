const aqp = require('api-query-params');
// --------------------------------------------------------------------------------------
exp = {};
// --------------------------------------------------------------------------------------
// parse query string
// args:
// 1) request url
// 2) array of collection keys, that should be whitelisted
// 3) function to validate time interval
// 4) optional parameter to validation function [bool]
//    only used in validate_interval
//    defines if any date is requied
//    -> true => both are required
//    -> false => none is required
// --------------------------------------------------------------------------------------
exp.parse_query_string = function(url, whitelist, validate, date_req) {
  var qs = url.match(/\?.*$/);  // try to match query string if present

  if(!qs) {
    var err = new Error("V dotazu není přítomen query string!");
    err.status = 400;
    throw err;
  }

  qs = qs[0];           // extract query string part from request url
  qs = qs.substr(1);   // remove '?'

  var query = aqp(qs, {         // parse query string
    whitelist : whitelist       // whitelist collection keys
  });

  validate(query, date_req);    // check correctly specified time interval, throws exception on error
  return query;
}
// --------------------------------------------------------------------------------------
// validate query for correct time interval
// --------------------------------------------------------------------------------------
exp.validate_days = function(query) {
  check_timestamp(query);       // throws exception on error
  valid_timestamp(query);       // throws exception on error

  if(query.filter.timestamp.constructor == Object && Object.keys(query.filter.timestamp).length == 2) {  // range
    var keys = Object.keys(query.filter.timestamp);
    for(var key in keys) {
      if(!(query.filter.timestamp[keys[key]].getHours() == 0 && query.filter.timestamp[keys[key]].getMinutes() == 0
        && query.filter.timestamp[keys[key]].getSeconds() == 0 && query.filter.timestamp[keys[key]].getMilliseconds() == 0)) {
          var err = new Error("nesprávná specifikace intervalu!");  // some part is set incorrectly
          err.status = 400;
          throw err;
      }
    }
  }
  else if(query.filter.timestamp.constructor == Object && Object.keys(query.filter.timestamp).length != 2) {  // more or less values
    var err = new Error("nesprávný počet hodnot proměnné timestamp pro interval!");
    err.status = 400;
    throw err;
  }
  else {    // one day only
    if(!(query.filter.timestamp.getHours() == 0 && query.filter.timestamp.getMinutes() == 0 
      && query.filter.timestamp.getSeconds() == 0 && query.filter.timestamp.getMilliseconds() == 0)) {
        var err = new Error("nesprávné datum!");  // some part is set incorrectly
        err.status = 400;
        throw err;
    }
  }
}
// --------------------------------------------------------------------------------------
// validate query for correct time interval
// --------------------------------------------------------------------------------------
exp.validate_interval = function(query, date_req) {
  if(date_req) {
    check_timestamp(query);
    valid_timestamp(query);

    if(typeof(query.filter.timestamp) == "object" && Object.keys(query.filter.timestamp).length > 1) {  // range
      // is any checking needed here ?
      // TODO
    }
    else {
      var err = new Error("koncový timestamp musí být definován!");
      err.status = 400;
      throw err;
    }
  }

  if(query.filter.timestamp != undefined)   // timestamp is defined
    valid_timestamp(query);     // check if date is correct
    // no other validation is needed
}
// --------------------------------------------------------------------------------------
function valid_timestamp(query)
{
  var keys = query.filter.timestamp;

  for(var key in keys)
    if(isNaN(Date.parse(keys[key]))) {   // invalid date
      var err = new Error("neplatné datum: " + keys[key]);
      err.status = 400;
      throw err;
    }
}
// --------------------------------------------------------------------------------------
function check_timestamp(query)
{
  if(query.filter.timestamp == undefined) {
    var err = new Error("timestamp musí být definován!");
    err.status = 400;
    throw err;
  }
}
// --------------------------------------------------------------------------------------
module.exports = exp;
