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
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

  query.filter.used_count = query.filter.used_count || { "$exists" : true };   // make sure used count is set

  // ===================================================
  // construct base query
  var aggregate_query = [
    {
      $match : query.filter       // filter by query
    },
    {
      $group :
        {
          _id :
            {
              inst_name : "$inst_name"  // group by inst_name -> query on multiple records, we want only on record on the output
            },
          used_count :
            {
              $sum : "$used_count"  // sum used_count
            }
        }
    },
    {
      $project :
        {
          used_count : 1,
          inst_name : "$_id.inst_name",   // id.inst_name -> inst_name
          _id : 0
        }
    }
  ];

  // ===================================================
  // add other operators, if defined in query

  if(query.sort) {
   aggregate_query.push({ $sort : query.sort });   // sort
  }

  if(query.limit) {
   aggregate_query.push({ $limit : query.limit }); // limit
  }

  if(query.skip) {
   aggregate_query.push({ $skip : query.skip });   // skip
  }

  // ===================================================
  // search

  req.db.roaming.aggregate(aggregate_query,
  function(err, items) {
    respond(err, items, res);
  });
}
// --------------------------------------------------------------------------------------
module.exports = router;
