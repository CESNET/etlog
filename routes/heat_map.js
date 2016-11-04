const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
// --------------------------------------------------------------------------------------
// get shared mac data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['timestamp', 'realm', 'institutions.realm', 'institutions.count'],
      qp.validate_days);
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  search_days(req, res, next, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_days(req, res, next, query) {
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
      $unwind : "$institutions"          // deconstruct institutions array
    },
    {
      $group :
        {
          _id :
            {
              realm : "$realm"      // group by realm
            },
          institutions :       // add users
            {
              $addToSet : "$institutions"
            }
        }
    },
    {
      $project :
        {
          realm : "$_id.realm",
          institutions : 1,
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

  req.db.heat_map.aggregate(aggregate_query,
  function(err, items) {
    if(err) {
      console.error(err);
      var err = new Error(err);
      next(err);
      return;
    }

    respond(items, res);
  });
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
