const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get unique users for realm
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      [ 'timestamp', 'username', 'visinst_1', 'visinst_2' ],
      qp.validate_days);
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  search(req, res, next, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search(req, res, next, query) {
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

  // ===================================================
  // construct base query
  var aggregate_query = [
    { $match : query.filter },      // filter by query
    { $project : { 
      _id : 0,
      time_needed : 1,
      username : 1,
      timestamp_1 : 1,
      timestamp_2 : 1,
      visinst_1 : 1,
      visinst_2 : 1,
      time_difference : { $divide : [ { $subtract : [ "$timestamp_2", "$timestamp_1" ] }, 1000 ] }, // difference is in milliseconds
    } },
  ];

  // ===================================================
  // add other operators, if defined in query
  agg.add_ops(aggregate_query, query);

  // ===================================================
  // search

  req.db.concurrent_users.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    }

    respond(convert(items), res);
  });
}
// --------------------------------------------------------------------------------------
// convert timestamp in data
// --------------------------------------------------------------------------------------
function convert(data)
{
  var ret = [];

  for(var item in data) {
    data[item].timestamp_1 = convert_time(data[item].timestamp_1);
    data[item].timestamp_2 = convert_time(data[item].timestamp_2);
    ret.push(data[item]);
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// convert UTC to localtime based on input
// --------------------------------------------------------------------------------------
function convert_time(date)
{
  d = new Date(date);
  d.setTime(d.getTime() + (-1 * d.getTimezoneOffset() * 60 * 1000));
  return d;
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
