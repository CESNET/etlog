var express = require('express');
var router = express.Router();
const aqp = require('api-query-params').default;    // uses ES6
// --------------------------------------------------------------------------------------
// get roaming data for organisations most using roaming
// timestamp, [inst_name, provided_count]
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var qs = req.url.substr(2);   // remove '/?'

  var query = aqp(qs, {         // parse query string
    whitelist : [ 'timestamp', 'inst_name', 'provided_count', 'used_count' ]       // whitelist collection keys
  });

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
      res.status(500).send({ error : "invalid date: " + keys[key]});        // send error status and message
      return;
    }
  }
  
  // valid cases for timestamp
  //
  // = exactly one day
  // = range from, to
  //
  // TODO - distinct date at 00:00:00:000 and other dates
  // needs to be implemented?
  if(typeof(query.filter.timestamp) == "object" && Object.keys(query.filter.timestamp).length > 1) {  // range
    if(Math.abs(range[0] - range[1]) % 86400000 == 0) {     // exact range of days
      search_days(req, res, query);
    }
    else {  // another range
      //search_interval(req, res, respond, query);
      // TODO
    }
  }
  else {    // one day only
    search_days(req, res, query);
  }
});
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err) {
    console.log(err);
    res.send(err);
    return;
  }
  
  res.json(items);
}
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_days(req, res, query) {
  query.filter.used_count = query.filter.used_count || { "$exists" : true };   // make sure used count is set

  req.db.roaming.find(query.filter,  { _id : 0, timestamp : 0})   // apply filter
  .skip(query.skip)     // skip
  .limit(query.limit)   // limit
  .sort(query.sort)     // sort
  .exec(function(err, items) {
    respond(err, items, res)    // respond to user
  });
}
// --------------------------------------------------------------------------------------
module.exports = router;
