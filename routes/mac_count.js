var express = require('express');
var router = express.Router();
const aqp = require('api-query-params').default;    // uses ES6
// --------------------------------------------------------------------------------------
// get mac_count data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url, 
    ['username', 'timestamp', 'count', 'addrs'],
    search_days, 
    search_interval);
  
  query.search(req, res, query.query);    // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_days(req, res, query) {
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

  // ===================================================
  // construct base query
  var aggregate_query = [
    {
      $match : query.filter       // filter by query
    },
    {
      $project :                  // limit to username, addrs
        {
          username : 1,
          addrs : 1
        }
    },
    {
      $unwind : "$addrs"          // deconstruct addrs array
    },
    {
      $group :
        {
          _id :
            {
              username : "$username"  // group by username -> query on multiple records, we want only on record on the output
            },
          addrs :
            {
              $addToSet : "$addrs"   // add arrays
            }
        }
    },
    {
      $project :
        {
          username : "$_id.username",   // id.username -> username
          count :
            {
              $size : "$addrs"          // number of addresses
            },
          addrs : 1,
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

  req.db.mac_count.aggregate(aggregate_query,
  function(err, items) {
    respond(err, items, res);
  });
}
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
module.exports = router;
