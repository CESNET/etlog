const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get count for mac count
// --------------------------------------------------------------------------------------
router.get('/mac_count', function(req, res, next) {
  var query = get_qs(req, [ 'timestamp', 'username', 'addrs', 'count' ]); // array of valid filters

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

  get_record_count(req.db.mac_count, req, res, next, aggregate_query, transform, filter_mac_count);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get count for shared mac
// --------------------------------------------------------------------------------------
router.get('/shared_mac', function(req, res, next) {
  var query = get_qs(req, ['timestamp', 'count', 'mac_address', 'users']); // array of valid filters

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

  get_record_count(req.db.shared_mac, req, res, next, aggregate_query, transform);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get count for logs
// --------------------------------------------------------------------------------------
router.get('/logs', function(req, res, next) {
  var query = get_qs_interval(req, [ 'timestamp', 'pn', 'csi', 'realm', 'visinst', 'result' ]); // array of valid filters

  // exclude possible regex from filter
  var regex = agg.check_regex(query.filter);

  // ===================================================
  // construct base query
  var aggregate_query = [
    {
      $match : query.filter       // filter by query
    },
  ];

  // before 460ec2438bd62a52d610c195270cb77fccc65051
  // strange issue happenned here
  // some long queries (~30+s) failed with timeout to mongodb
  // it seems, that this is still somehow not solved - see https://github.com/Automattic/mongoose/issues/4789
  // two stage regex matching should avoid this even for long queries
  //


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

  aggregate_query.push({ $group: { _id: null, count: { $sum: 1 } } });       // group just to count number of records
  aggregate_query.push({ $project : { count : 1, _id : 0 } });

  get_record_count(req.db.logs, req, res, next, aggregate_query, transform, filter_by_username);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get count for concurrent users
// --------------------------------------------------------------------------------------
router.get('/concurrent_users', function(req, res, next) {
  var query = get_qs(req, [ 'timestamp', 'username', 'visinst_1', 'visinst_2', "revision", "diff_needed_timediff", "mac_diff" ]); // array of valid filters

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

  aggregate_query.push({ $group: { _id: null, count: { $sum: 1 } } });       // group just to count number of records
  aggregate_query.push({ $project : { count : 1, _id : 0 } });

  get_record_count(req.db.concurrent_users, req, res, next, aggregate_query, transform, filter_by_username);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------


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
function get_record_count(collection, req, res, next, aggregate_query, transform_fn, filter_fn)
{
  collection.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    };

    if(filter_fn)
      respond(filter_fn(req, transform_fn(items)), res)
    else
      respond(transform_fn(items), res)
  });
}
// --------------------------------------------------------------------------------------
// filter results so each user can search only relevant records
// user: only his records
// realm admin: only records for all administered realms
// --------------------------------------------------------------------------------------
function filter_by_username(req, data)
{
  var ret = [];

  if(req.session.user.role == "user") {
    for(var item in data)
      if(data[item].username == req.session.user.username)
        ret.push(data[item]);
  }

  else if(req.session.user.role == "realm_admin") {
    for(var realm in req.session.user.administered_realms)
      for(var item in data)
        if(data[item].realm == req.session.user.administered_realms[realm])
          ret.push(data[item]);
  }

  else if(req.session.user.role == "admin")  // no filtration
    return data;

  return ret;
}
// --------------------------------------------------------------------------------------
// filter results so each user can search only relevant records
// realm admin: only records for all administered realms
// --------------------------------------------------------------------------------------
function filter_mac_count(req, data)
{
  var ret = [];

  if(req.session.user.role == "user")
    return ret;

  else if(req.session.user.role == "realm_admin") {
    for(var realm in req.session.user.administered_realms)
      for(var item in data)
        if(data[item].username.replace(/^.*@/, "") == req.session.user.administered_realms[realm])
          ret.push(data[item]);
  }

  else if(req.session.user.role == "admin")  // no filtration
    return data;

  return ret;
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
