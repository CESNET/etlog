const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get data based on query
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['pn', 'timestamp', 'csi', 'result', 'realm', 'visinst'],
    qp.validate_interval,
    false);       // no timestamp may be present in valid query

  // TODO
  // permissions must be set that way, so the user can search only his mac adress and username
  // TODO - username must be always set in frontend !

  if(Object.keys(query.filter).length == 0) {   // empty filter
    var err = new Error("Neplatný dotaz!");
    err.status = 400;
    throw err;
  }

  search(req, res, next, query);
});
// --------------------------------------------------------------------------------------
// search for given query
// --------------------------------------------------------------------------------------
function search(req, res, next, query) {
  // exclude possible regex from
  var regex = agg.check_regex(query.filter);

  // ===================================================
  // construct base query
  var aggregate_query = [
    {
      $match : query.filter       // filter by query
    },
  ];

  if(Object.keys(regex).length > 0) {
    agg.add_stage(aggregate_query, { $match : regex });
  }

  agg.add_stage(aggregate_query, {
      $project :
        {
          timestamp : 1,
          realm : 1,
          viscountry : 1,
          visinst : 1,
          mac_address : "$csi",
          username : "$pn",
          result : 1,
          _id : 0
        }
    });

  // ===================================================
  // add other operators, if defined in query
  agg.add_ops(aggregate_query, query);

  // ===================================================
  // search

  var stream = req.db.logs.aggregate(aggregate_query).cursor({ batchSize: 1000 }).exec().stream();
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
    respond(convert(data), res);
  });
}
// --------------------------------------------------------------------------------------
// convert timestamp in data
// --------------------------------------------------------------------------------------
function convert(data)
{
  var ret = [];

  if(data.length != 0 && !data[0].timestamp)   // output is limited to fields
    return data;

  for(var item in data) {
    data[item].timestamp = convert_time(data[item].timestamp);
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
