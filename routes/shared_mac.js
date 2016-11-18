const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
// --------------------------------------------------------------------------------------
// get shared mac data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['timestamp', 'count', 'mac_address', 'users'],
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
      $unwind : "$users"          // deconstruct users array
    },
    {
      $group :
        {
          _id :
            {
              mac_address : "$mac_address"      // group by mac address
            },
          users :       // add users
            {
              $addToSet : "$users"
            }
        }
    },
    {
      $project :
        {
          mac_address : "$_id.mac_address",
          users : 1,
          count :
            {
              $size : "$users"          // number of users
            },
          _id : 0
        }
    }
  ];
  
  // ===================================================
  // add other operators, if defined in query

  if(query.sort) {
    aggregate_query.push({ $sort : query.sort });   // sort
  }

  if(query.skip && query.limit) {   // both skip and limit
    aggregate_query.push({ $limit : query.limit + query.skip });   // limit to limit + skip
  }

  if(query.skip) {
    aggregate_query.push({ $skip : query.skip });   // skip
  }

  if(query.limit) {
    aggregate_query.push({ $limit : query.limit }); // limit
  }

  // ===================================================
  // search

  req.db.shared_mac.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
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
