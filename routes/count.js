const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get count for mac count
// --------------------------------------------------------------------------------------
router.get('/mac_count', function(req, res, next) {
  try {
    var query = get_qs(req, [ 'timestamp', 'username', 'addrs', 'count' ]); // array of valid filters
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  // ===================================================
  // matching of single value against array does not make sense
  // transform to $in
  if(query.filter.addrs && !(query.filter.addrs.constructor === Object)) {
    if(query.filter.addrs.constructor === RegExp || query.filter.addrs.constructor === String)  // string or regex added without typecasting
      query.filter.addrs = { $in : [ query.filter.addrs ] };
    else
      query.filter.addrs = { $in : [ String(query.filter.addrs) ] };    // number is converted to string
  }

  // ===================================================
  // if query.filter contains some conditions for data eg. count,
  // the condition must be applied to result of all records aggregated across given timestamps
  // -> the condition must be applied after aggregation !

  var cond = agg.check_filter(query.filter, [ "count" ]);

  // ===================================================

  var aggregate_query = [
    {
      $match : query.filter       // filter by query
    },
    {
      $unwind : "$addrs"          // deconstruct addrs array
    },
    {
      $group :
        {
          _id :
            {
              username : "$username"  // group by username -> query on multiple records, we want only on record on the output
            },
          addrs :
            {
              $addToSet : "$addrs"   // add arrays
            }
        }
    },
    {
      $project :
        {
          username : "$_id.username",   // id.username -> username
          count :
            {
              $size : "$addrs"          // number of addresses
            },
          addrs : 1,
          _id : 0
        }
    }
  ];

  // ===================================================
  // add condition from original filter if defined
  agg.add_cond(aggregate_query, cond);

  // ===================================================

  aggregate_query.push({ $group: { _id: null, count: { $sum: 1 } } });       // group just to count number of records
  aggregate_query.push({ $project : { count : 1, _id : 0 } });

  get_record_count(req.db.mac_count, res, next, aggregate_query, transform);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get count for shared mac
// --------------------------------------------------------------------------------------
router.get('/shared_mac', function(req, res, next) {
  try {
    var query = get_qs(req, ['timestamp', 'count', 'mac_address', 'users']); // array of valid filters
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  // ===================================================
  // matching of single value against array does not make sense
  // transform to $in
  if(query.filter.users && !(query.filter.users.constructor === Object)) {
    if(query.filter.users.constructor === RegExp || query.filter.users.constructor === String)  // string or regex added without typecasting
      query.filter.users = { $in : [ query.filter.users ] };
    else
      query.filter.users = { $in : [ String(query.filter.users) ] };    // number is converted to string
  }

  // ===================================================
  // if query.filter contains some conditions for data eg. count,
  // the condition must be applied to result of all records aggregated across given timestamps
  // -> the condition must be applied after aggregation !

  var cond = agg.check_filter(query.filter, [ "count" ]);

  // ===================================================

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
  // add condition from original filter if defined
  agg.add_cond(aggregate_query, cond);

  // ===================================================

  aggregate_query.push({ $group: { _id: null, count: { $sum: 1 } } });       // group just to count number of records
  aggregate_query.push({ $project : { count : 1, _id : 0 } });

  get_record_count(req.db.shared_mac, res, next, aggregate_query, transform);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get count for logs
// --------------------------------------------------------------------------------------
router.get('/logs', function(req, res, next) {
  try {
    var query = get_qs_interval(req, [ 'timestamp', 'pn', 'csi', 'realm', 'visinst', 'result' ]); // array of valid filters
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  if(!query.filter.pn) {
    var err = new Error("Uživatelské jméno musí být zadáno!");
    err.status = 400;
    next(err);
    return;
  }

  req.db.logs.count(query.filter,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    };

    respond(items, res)
  });
});
// --------------------------------------------------------------------------------------
// get count for succ logins
// --------------------------------------------------------------------------------------
router.get('/succ_logins', function(req, res, next) {
  try {
    var query = get_qs(req, [ 'timestamp', 'username', 'count' ]); // array of valid filters
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  // ===================================================
  // if query.filter contains some conditions for data eg. count,
  // the condition must be applied to result of all records aggregated across given timestamps
  // -> the condition must be applied after aggregation !

  var cond = agg.check_filter(query.filter, [ "count" ]);

  // ===================================================

  var aggregate_query = [
    {
      $match : query.filter       // filter by query
    },
    {
      $group :
        {
          _id :
            {
              username : "$username"  // group by username -> query on multiple records, we want only on record on the output
            },
          count :
            {
              $sum : "$count"      // sum count
            },
        }
    },
    {
      $project :
        {
          count : 1,
          username : "$_id.username",   // id.username -> username
          _id : 0
        }
    }
  ];

  // ===================================================
  // add condition from original filter if defined
  agg.add_cond(aggregate_query, cond);

  // ===================================================

  aggregate_query.push({ $group: { _id: null, count: { $sum: 1 } } });       // group just to count number of records
  aggregate_query.push({ $project : { count : 1, _id : 0 } });

  get_record_count(req.db.succ_logins, res, next, aggregate_query, transform);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// transform array containing dict just to number itself
// --------------------------------------------------------------------------------------
function transform(data)
{
  if(data.length == 0)
    return 0;

  return data[0].count;
}
// --------------------------------------------------------------------------------------
// get mongo query from url
// --------------------------------------------------------------------------------------
function get_qs(req, filters)
{
  var query = qp.parse_query_string(req.url,
    filters,
    qp.validate_days);

  return query;
}
// --------------------------------------------------------------------------------------
// get mongo query from url
// time specification allowed
// --------------------------------------------------------------------------------------
function get_qs_interval(req, filters)
{
  var query = qp.parse_query_string(req.url,
    filters,
    qp.validate_interval);

  return query;
}
// --------------------------------------------------------------------------------------
// return count of record for specified timestamp interval
// --------------------------------------------------------------------------------------
function get_record_count(collection, res, next, aggregate_query, transform_fn)
{
  collection.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    };

    respond(transform_fn(items), res)
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
