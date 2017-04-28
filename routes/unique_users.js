const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get unique users for realm
// --------------------------------------------------------------------------------------
router.get('/realm', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['timestamp', 'realm' ],      // TODO - realm is mandatory here
    qp.validate_days);
  search_realm(req, res, next, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get unique users for visinst
// --------------------------------------------------------------------------------------
router.get('/visinst', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['timestamp', 'realm' ],      // TODO - realm is mandatory here
    qp.validate_days);
  search_visinst(req, res, next, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_visinst(req, res, next, query) {
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

  // ===================================================
  // construct base query
  var aggregate_query = [
    { $match : query.filter },      // filter by query
    { $project : { realm : 1, visinst_addrs : 1  } },     // limit to realm and visinst_addrs
    { $unwind : "$visinst_addrs" },                       // deconstruct array
    { $group : { _id : { realm : "$realm" }, addrs : { $addToSet : "$visinst_addrs" } } },         // group by realm, add addrs to array
    { $project : { count : { $size : "$addrs" }, _id : 0 } },
  ];

  // ===================================================
  // search

  req.db.unique_users.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    }

    respond(items[0].count, res);
  });
}
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_realm(req, res, next, query) {
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

  // ===================================================
  // construct base query
  var aggregate_query = [
    { $match : query.filter },      // filter by query
    { $project : { realm : 1, realm_addrs : 1  } },     // limit to realm and realm_addrs
    { $unwind : "$realm_addrs" },                       // deconstruct array
    { $group : { _id : { realm : "$realm" }, addrs : { $addToSet : "$realm_addrs" } } },         // group by realm, add addrs to array
    { $project : { count : { $size : "$addrs" }, _id : 0 } },
  ];

  // ===================================================
  // search

  req.db.unique_users.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    }

    respond(items[0].count, res);
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
