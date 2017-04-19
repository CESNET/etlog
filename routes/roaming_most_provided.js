const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get roaming data for organisations most providing roaming
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['timestamp', 'inst_name', 'provided_count', 'used_count'],
    qp.validate_days);
  search_days(req, res, next, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_days(req, res, next, query) {
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

  query.filter.provided_count = query.filter.provided_count || { "$exists" : true };   // make sure provided count is set

  // ===================================================
  // if query.filter contains some conditions for data eg. count,
  // the condition must be applied to result of all records aggregated across given timestamps
  // -> the condition must be applied after aggregation !

  var cond = agg.check_filter(query.filter, [ "provided_count", "used_count" ]);

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
  // add condition from original filter if defined
  agg.add_cond(aggregate_query, cond);

  // ===================================================
  // add other operators, if defined in query
  agg.add_ops(aggregate_query, query);

  // ===================================================
  // search

 var stream = req.db.roaming.aggregate(aggregate_query).cursor({ batchSize: 1000 }).exec().stream();
 var data = [];

  stream.on('error', function (err1) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    }
  });

  stream.on('data', function(item) {
    data.push(item);
  });

  stream.on('end', function(items) {
    respond(data, res);
  });
}
// --------------------------------------------------------------------------------------
module.exports = router;
