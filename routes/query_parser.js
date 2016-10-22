const aqp = require('api-query-params').default;    // uses ES6
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

  if(!qs)
    throw { error : "no query string present!"};

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

  if(typeof(query.filter.timestamp) == "object" && Object.keys(query.filter.timestamp).length > 1) {  // range
    var keys = Object.keys(query.filter.timestamp);
    for(var key in keys) {
      if(!(query.filter.timestamp[keys[key]].getHours() == 0 && query.filter.timestamp[keys[key]].getMinutes() == 0
        && query.filter.timestamp[keys[key]].getSeconds() == 0 && query.filter.timestamp[keys[key]].getMilliseconds() == 0))
        throw { error : "incorrect interval specification!" };  // some part is set incorrectly
    }
  }
  else {    // one day only
    if(!(query.filter.timestamp.getHours() == 0 && query.filter.timestamp.getMinutes() == 0 
      && query.filter.timestamp.getSeconds() == 0 && query.filter.timestamp.getMilliseconds() == 0))
      throw { error : "incorrect date!" };  // some part is set incorrectly
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
      throw { error : "end timestamp not defined!" };
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
    if(isNaN(Date.parse(keys[key])))    // invalid date
      throw { error : "invalid date: " + keys[key]};
}
// --------------------------------------------------------------------------------------
function check_timestamp(query)
{
  if(query.filter.timestamp == undefined)
    throw { error : "timestamp must be defined!"};
}
// --------------------------------------------------------------------------------------
module.exports = exp;
