const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get shared mac data
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = qp.parse_query_string(req.url,
    ['timestamp', 'count', 'mac_address', 'users'],
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
  // exact matching of single value against array does not make sense
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
  // construct base query
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
  // add other operators, if defined in query
  agg.add_ops(aggregate_query, query);

  // ===================================================
  // search

 var stream = req.db.shared_mac.aggregate(aggregate_query).cursor({ batchSize: 1000 }).exec().stream();
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
    respond(filter_data(req, data), res);
  });
}
// --------------------------------------------------------------------------------------
// filter results so each user can search only relevant records
// realm admin: only records for all administered realms
// --------------------------------------------------------------------------------------
function filter_data(req, data)
{
  var ret = [];
  var tmp;

  if(req.session.user.role == "user")
    return ret;

  else if(req.session.user.role == "realm_admin") {
    for(var realm in req.session.user.administered_realms)
      for(var item in data) {
        tmp = data[item];

        for(var user in data[item].users)
          if(data[item].users[user].replace(/^.*@/, "") != req.session.user.administered_realms[realm])
            tmp.users[user] = tmp.users[user].replace(/^.*@/, "*filtered*@");

        ret.push(tmp);
      }
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
