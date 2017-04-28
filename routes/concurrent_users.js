const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get unique users for realm
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    [ 'timestamp', 'username', 'visinst_1', 'visinst_2', "revision", "diff_needed_timediff", "mac_diff" ],
    qp.validate_days);
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
  // if query.filter contains some conditions for data eg. count,
  // the condition must be applied to result of all records aggregated across given timestamps
  // -> the condition must be applied after aggregation !

  var cond = agg.check_filter(query.filter, [ "diff_needed_timediff" ]);
  var mac_diff = agg.check_filter(query.filter, [ "mac_diff" ]);

  // ===================================================
  // construct base query
  var aggregate_query = [
    { $match : query.filter },      // filter by query
    { $project : { 
      _id : 0,
      timestamp     : 1,
      timestamp_1   : 1,
      timestamp_2   : 1,
      visinst_1     : 1,
      visinst_2     : 1,
      username      : 1,
      mac_address_1 : 1,
      mac_address_2 : 1,
      time_needed   : 1,
      dist          : 1,
      time_difference : { $divide : [ { $subtract : [ "$timestamp_2", "$timestamp_1" ] }, 1000 ] }, // difference is in milliseconds
      diff_needed_timediff : { $subtract : [ "$time_needed", { $divide : [ { $subtract : [ "$timestamp_2", "$timestamp_1" ] }, 1000 ] } ] }
    } },
  ];


  // ===================================================
  // add condition from original filter if defined
  agg.add_cond(aggregate_query, cond);

  // ===================================================
  // add redact stage if mac_diff is required
  if(Object.keys(mac_diff).length > 0) {
    if(mac_diff.mac_diff == true) // true - different mac addresses
      agg.add_stage(aggregate_query, { "$redact" : { "$cond" : [ { "$ne" : [ "$mac_address_1", "$mac_address_2" ] }, "$$KEEP", "$$PRUNE" ] } });
    else                          // false - same mac addresses
      agg.add_stage(aggregate_query, { "$redact" : { "$cond" : [ { "$eq" : [ "$mac_address_1", "$mac_address_2" ] }, "$$KEEP", "$$PRUNE" ] } });
  }

  // ===================================================
  // add other operators, if defined in query
  agg.add_ops(aggregate_query, query);

  // ===================================================
  // search

  req.db.concurrent_users.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
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
    data[item].timestamp = convert_time(data[item].timestamp);
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
