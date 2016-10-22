const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
// --------------------------------------------------------------------------------------
// get failed logins data for day(s)
// --------------------------------------------------------------------------------------
router.get('/days', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['username', 'timestamp', 'fail_count', 'ok_count', 'ratio'],
      qp.validate_days);
  }
  catch(err) {
    res.status(400).send(err.error);
    return;
  }

  search_days(req, res, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get failed logins data for specific interval
// --------------------------------------------------------------------------------------
router.get('/interval', function(req, res, next) {
  try {
    var query = qp.parse_query_string(req.url,
      ['username', 'timestamp', 'fail_count', 'ok_count', 'ratio'],
      qp.validate_interval,
      true);
  }
  catch(err) {
    res.status(400).send(err.error);
    return;
  }

  search_interval(req, res, query);     // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_interval(req, res, query) {
  username = query.filter.username || { $ne : "" };     // specific username or no empty one

  dict = {
    timestamp : query.filter.timestamp,      // get data for specified interval
    pn : username
  };

  // TODO - other fields will be hard to get from this collection
  // should this logic be implemented ?

  req.db.logs.aggregate(
  [ 
  { 
    $match : dict
  }, 
  { 
    $project : 
      { 
        timestamp : 1, pn : 1, result : 1   // limit to timestamp, pn and result
      } 
  },  
  { 
    $group :                                // group by pair [ pn, result ]
    { 
      _id : 
      { 
        pn : "$pn", result : "$result" 
      }, 
      count :                               // count number of occurences
      { 
        $sum : 1 
      } 
    } 
  }, 
  { 
    $group :                                // group again by username
    { 
      _id : 
        { 
          pn : "$_id.pn" 
        }, 
      results :                             // add result to array
        { 
          $addToSet : "$$ROOT._id.result" 
        }, 
      result_count :                        // add count of results to array
        { 
          $addToSet : "$count" 
        }, 
    } 
  }, 
  { 
    $match :                                // exclude users with only OK results
    { 
      results : 
        { 
          $in : [ "FAIL" ] 
        } 
    }  
  }
  ], function(err, items) {
    respond(err, transform(items), res)
  });
}
// --------------------------------------------------------------------------------------
// search database for specified data
// timestamp matches specific day or range of days
// --------------------------------------------------------------------------------------
function search_days(req, res, query) {
  // query for username with records for multiple days
  // gets results separated for each day !
  // this is defined by the query -> needs to be computed on the fly

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
  // add other operators, if defined in query

  if(query.sort) {
   aggregate_query.push({ $sort : query.sort });   // sort
  }

  if(query.limit) {
   aggregate_query.push({ $limit : query.limit }); // limit
  }

  if(query.skip) {
   aggregate_query.push({ $skip : query.skip });   // skip
  }

  // ===================================================
  // search

  req.db.failed_logins.aggregate(aggregate_query,
  function(err, items) {
    respond(err, items, res);
  });
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err) {
    console.log(err);
    res.send(err);
    return;
  }
  
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

    if(items[item]['results'].length != items[item]['result_count'].length) {   // both numbers for ok and fail are the same [ result_count.lenght == 1 ]
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
module.exports = router;
