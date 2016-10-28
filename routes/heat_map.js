var express = require('express');
var router = express.Router();
const qp = require('./query_parser');
// --------------------------------------------------------------------------------------
// get shared mac data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['timestamp', 'inst_name', 'institutions.inst_name', 'institutions.count'],
      qp.validate_days);
  }
  catch(err) {
    res.status(400).send(err.error);
    return;
  }

  search_days(req, res, query);     // perform search with constructed mongo query
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
      $unwind : "$institutions"          // deconstruct institutions array
    },
    {
      $group :
        {
          _id :
            {
              inst_name : "$inst_name"      // group by isnt name
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
          inst_name : "$_id.inst_name",
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

  //req.db.heat_map_test.aggregate(aggregate_query,
  req.db.heat_map.aggregate(aggregate_query,
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
