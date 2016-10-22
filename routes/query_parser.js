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
//    defines if both dates (starting and ending are requied)
// --------------------------------------------------------------------------------------
exp.parse_query_string = function(url, whitelist, validate, date_req) {

  var qs = url.match(/\?.*$/)[0];     // extract query string part from request url
  qs = qs.substr(1);   // remove '?'

  var query = aqp(qs, {         // parse query string
    whitelist : whitelist       // whitelist collection keys
  });

  if(query.filter.timestamp == undefined) {    // do not search if timestamp is not defined
    throw { error : "timestamp must be defined!"};
  }

  // validation
  var keys = query.filter.timestamp;

  for(var key in keys)
    if(isNaN(Date.parse(keys[key])))    // invalid date
      throw { error : "invalid date: " + keys[key]};
  
  if(!validate(query, date_req)) {  // check correctly specified time interval
    throw { error : "incorrect interval specification!"};
  }

  return query;
}
// --------------------------------------------------------------------------------------
// validate query for correct time interval
// --------------------------------------------------------------------------------------
exp.validate_days = function(query) {
  if(typeof(query.filter.timestamp) == "object" && Object.keys(query.filter.timestamp).length > 1) {  // range
    var keys = Object.keys(query.filter.timestamp);
    for(var key in keys) {
      if(!(query.filter.timestamp[keys[key]].getHours() == 0 && query.filter.timestamp[keys[key]].getMinutes() == 0 
        && query.filter.timestamp[keys[key]].getSeconds() == 0 && query.filter.timestamp[keys[key]].getMilliseconds() == 0))
        return false;       // some part is set incorrectly
    }
  }
  else {    // one day only
    return (query.filter.timestamp.getHours() == 0 && query.filter.timestamp.getMinutes() == 0 
    && query.filter.timestamp.getSeconds() == 0 && query.filter.timestamp.getMilliseconds() == 0);
  }

  return true;
}
// --------------------------------------------------------------------------------------
// validate query for correct time interval
// --------------------------------------------------------------------------------------
exp.validate_interval = function(query, date_req) {
  if(typeof(query.filter.timestamp) == "object" && Object.keys(query.filter.timestamp).length > 1) {  // range
    // is any checking needed here ?
    // TODO
  }
  else {
    if(date_req)        // both dates are required
      return false;
    else                // one date is sufficient
      return true;
  }

  return true;
}
// --------------------------------------------------------------------------------------
module.exports = exp;
