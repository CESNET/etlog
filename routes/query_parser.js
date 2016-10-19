const aqp = require('api-query-params').default;    // uses ES6
// --------------------------------------------------------------------------------------
exp = {};
// --------------------------------------------------------------------------------------
// parse query string
// args:
// 1) request url
// 2) array of collection keys, that should be whitelisted
// 3) function for interval of days - days have to start at 00:00:00
// 4) function for other interval 
// --------------------------------------------------------------------------------------
exp.parse_query_string = function(url, whitelist, search_days, search_interval) {

  var qs = url.substr(2);   // remove '/?'

  var query = aqp(qs, {         // parse query string
    whitelist : whitelist       // whitelist collection keys
  });

  // TODO - err status
  if(query.filter.timestamp == undefined) {    // do not search if timestamp is not defined
    res.status(500).send({ error : "timestamp must be defined!"});        // send error status and message
    return;
  }

  // validation
  var keys = query.filter.timestamp;
  var range = [];

  for(var key in keys) {
    range.push(keys[key]);      // for further processing

    if(isNaN(Date.parse(keys[key]))) {    // invalid date
      res.status(500).send({ error : "invalid date: " + keys[key]});        // send error status and message // TODO
      return;
    }
  }
  
  // debug
  console.log(query);
  
  // valid cases for timestamp
  //
  // = exactly one day
  // = range from, to
  //
  // TODO - distinct date at 00:00:00:000 and other dates
  // needs to be implemented?
  
  // TODO - day start at .. 

  if(typeof(query.filter.timestamp) == "object" && Object.keys(query.filter.timestamp).length > 1) {  // range
    if(Math.abs(range[0] - range[1]) % 86400000 == 0) {     // exact range of days
      return { query: query, search : search_days };
    }
    else {  // another range
      return { query: query, search : search_interval };
    }
  }
  else {    // one day only
    return { query: query, search : search_days };
  }
}
// --------------------------------------------------------------------------------------
module.exports = exp;
