const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get shared mac data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['timestamp', 'realm', 'institutions.realm', 'institutions.count'],
    qp.validate_days);
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
    // group by institutions.realm first to get total count for all institutions.realm
    { $group : { _id : { realm : "$realm", inst_realm : "$institutions.realm" }, count : { $sum : "$institutions.count" } } },
    // group by realm only, add object to instituons
    { $group : { _id : { realm : "$_id.realm" }, institutions : { $addToSet : { realm : "$_id.inst_realm", count : "$count" } } } },
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
  agg.add_ops(aggregate_query, query);

  // ===================================================
  // search

 var stream = req.db.heat_map.aggregate(aggregate_query).cursor({ batchSize: 1000 }).exec();
 var data = [];

  stream.on('error', function (err1) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
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
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
