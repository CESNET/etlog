var express = require('express');
var router = express.Router();
const aqp = require('api-query-params').default;    // uses ES6
// --------------------------------------------------------------------------------------
// get roaming data for organisations most providing roaming
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url, 
    ['timestamp', 'inst_name', 'provided_count', 'used_count'],
    search_days, 
    search_interval);
  
  query.search(req, res, query.query);    // perform search with constructed mongo query
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

  query.filter.provided_count = query.filter.provided_count || { "$exists" : true };   // make sure provided count is set

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
          provided_count :
            {
              $sum : "$provided_count"  // sum provided_count
            }
        }
    },
    {
      $project :
        {
          provided_count : 1,
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
