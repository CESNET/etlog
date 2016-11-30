const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
const agg = require('./aggregation');
// --------------------------------------------------------------------------------------
// get failed logins data for day(s)
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['username', 'timestamp', 'fail_count', 'ok_count', 'ratio'],
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
  // if query.filter contains some conditions for data eg. count,
  // the condition must be applied to result of all records aggregated across given timestamps
  // -> the condition must be applied after aggregation !

  var cond = agg.check_filter(query.filter, [ "fail_count", "ok_count" ]);

  // ===================================================
  // construct base query
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
          ok_count :
            {
              $sum : "$ok_count"      // sum ok_count
            },
          fail_count :
            {
              $sum : "$fail_count"    // sum fail_count
            }
        }
    },
    {
      $project :
        {
          ratio :                     // ratio = fail_count / (fail_count + ok_count)
            {
              $divide :
              [
                "$fail_count",
                {
                  $add :
                  [
                    "$fail_count",
                    "$ok_count"
                  ]
                }
              ]
            },
          fail_count : 1,
          ok_count : 1,
          username : "$_id.username",   // id.username -> username
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

  req.db.failed_logins.aggregate(aggregate_query,
  function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    }

    respond(round_ratio(items), res);
  });
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
// transform item structure
// input : 
// { _id: { pn: 'skgtns1@ucl.ac.uk' }, results: [ 'OK', 'FAIL' ], result_count: [ 2, 1 ] }
// output:
// { username: 'skgtns1@ucl.ac.uk', OK: 2, FAIL: 1, ratio: 0.3333333333333333, timestamp: 2016-09-12T22:00:00.000Z }
// --------------------------------------------------------------------------------------
function transform(items) {
  var arr = [];
  var dict = {};

  for(var item in items) {
    dict = {};              // needed for deep copy
    dict['username'] = items[item]['_id']['pn'];

    if(items[item]['results'].length != items[item]['result_count'].length) {   // both numbers for ok and fail are the same [ result_count.length == 1 ]
        dict['ok_count'] = items[item]['result_count'][0];
        dict['fail_count'] = items[item]['result_count'][0];
    }
    else {  // both numbers are different
      //for(var i = 0; i < items[item]['results'].length; i++)
      //  dict[items[item]['results'][i]] = items[item]['result_count'][i]; 
      // this code can be used, but dict keys "OK" and "FAIL" have to be transladed
      // also "OK" may not be present at all, so it must be filled manually

      // another problem here is that order of values in Array results (results: [ 'OK', 'FAIL' ]) is undefined
      // order of values in result_count corresponds to order of results
      if(items[item]['results'][0] == "OK") {   //  results: [ 'OK', 'FAIL' ]
        dict['ok_count'] = items[item]['result_count'][0];
        dict['fail_count'] = items[item]['result_count'][1];
      }
      else {   //  results: [ 'FAIL', 'OK' ]
        // "OK" may be undefined !

        dict['fail_count'] = items[item]['result_count'][0];
        dict['ok_count'] = items[item]['result_count'][1] || 0; // if "OK" is undefined, count is 0
      }
    }

    dict['ratio'] =  (dict['fail_count'] / (dict['fail_count'] + dict['ok_count']));
    arr.push(dict);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
function round_ratio(items)
{
  arr = [];

  for(var item in items) {
    items[item].ratio = Number((items[item].ratio).toFixed(3));
    arr.push(items[item]);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
module.exports = router;
