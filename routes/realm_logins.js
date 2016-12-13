const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get successful logins data for day(s)
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['realm', 'timestamp'],
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
    // group by realm, sum counts
    { $group : { _id : { realm : "$realm" }, ok_count : { $sum : "$ok_count" }, fail_count : { $sum : "$fail_count" } } },
    { $project : { realm : "$_id.realm", ok_count : 1, fail_count : 1, _id : 0 } },
  ];

  req.db.realm_logins.aggregate(aggregate_query,
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
