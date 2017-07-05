const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['timestamp' ],
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
  // construct base query
  var aggregate_query = [
    { $match : query.filter },      // filter by query
    { $project : { visinst_1 : 1, visinst_2 : 1  } },     // limit to visited instituons
    { $group : { _id : { visinst_1 : "$visinst_1", visinst_2 : "$visinst_2" }, count : { $sum : 1 } } },
    { $sort : { count : -1 } },
    { $project : { visinst_1 : "$_id.visinst_1", visinst_2 : "$_id.visinst_2", count : 1, _id : 0 } },
  ];

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

    respond(filter_data(req, items), res);
  });
}
// --------------------------------------------------------------------------------------
// filter results so each user can search only relevant records
// realm admin: only records for all administered realms
// --------------------------------------------------------------------------------------
function filter_data(req, data)
{
  var ret = [];

  if(!req.headers["remote_user"]) {     // remote user not set for machine processing
    var ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    check_privileged_ips(req, ip, function(found) {
      if(found)
        return data;      // no filtering for machine processing
      else
        return ret;      // not found in privileged ips
    });
  }

  else if(req.session.user.role == "user")
    return ret;

  return data;  // no filtration othewrise
}
// --------------------------------------------------------------------------------------
// check database for specific privileged ip
// --------------------------------------------------------------------------------------
function check_privileged_ips(req, ip, callback)
{
  // search for privileged ip
  req.db.privileged_ips.find({ "ip" : ip }, { ip : 1, _id : 0 }, function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    }

    if(items.length > 0)
      callback(true);
    else
      callback(false);
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
