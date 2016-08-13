var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.post('/', function(req, res, next) {
  search(req, res, respond);
});
// --------------------------------------------------------------------------------------
function search(req, res, next) {
  // debug
  console.log("req.body:");
  console.log(req.body);

  if(req.body.percent == "")   /* no main search key was entered */
    return res.json([]);     // do not search database 

  var percent = req.body.percent;

  // debug
  //console.log("dict:");
  //console.log(dict);

  // search db
  req.db.record.aggregate(
  [ 
  { 
    $match : 
      { 
        pn : 
          { 
            $ne : ""        // no empty usernames
          } 
      } 
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
  //{ 
  //  $sort :                                 // sort by username, not neccessary ?
  //    { 
  //      "_id.pn" : 1 
  //    } 
  //},  
  { 
    $group :                                // group again
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
  ], 
  //  { allowDiskUse:true }     // db shell
    function (err, items) {
      if(err == null)
        items = filter(count_ratio(to_dict(items)), percent);

      respond(err, items, res);
    });
}
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
// transform documents for futher processing
// input :
//  { _id: { pn: 'rahemanf@cuni.cz' },
//    results: [ 'OK', 'FAIL' ],
//    result_count: [ 402, 1 ] }
//
// output: 
// 'rahemanf@cuni.cz': { OK: 402, FAIL: 1 }
// --------------------------------------------------------------------------------------
function to_dict(items)
{
  dict = {};

  for(var item in items) {
    var key = items[item];
    dict[key._id.pn] = {};     // key in is the "PN" attribute

    // careful - mongodb adds unique values by addToSet!
    // FAIL and OK can be same count !

    if(key.results.length != key.result_count.length) {
        dict[key._id.pn]["OK"] = key.result_count[0];       // both are the same
        dict[key._id.pn]["FAIL"] = key.result_count[0];
    }

    else 
      for(var i = 0; i < key.results.length; i++)
        dict[key._id.pn][key.results[i]] = key.result_count[i]; // set key [FAIL, OK] for related count
                                                                  // OK count could be 0 - empty key and value
  }

  return dict;
}
// --------------------------------------------------------------------------------------
// count ratio from OK and FAIL count
// input :
// 'rahemanf@cuni.cz': { OK: 402, FAIL: 1 }
//
// output :
// 'rahemanf@cuni.cz': { OK: 402, FAIL: 1, RATIO: 0.002487562 }
// --------------------------------------------------------------------------------------
function count_ratio(items)
{
  for(var key in items) {
    var fail = items[key]["FAIL"];
    var ok = items[key]["OK"];
  
    if(ok == undefined)
      ok = 0;

    var ratio = (fail / ok) * 100;

    if (ratio == Number.POSITIVE_INFINITY) {    // no successful logins
      ratio = 100;  // 100 %
      items[key]["OK"] = 0;
    }

    items[key]["RATIO"] = ratio;
  }

  return items;    // leave complex sorting for frontend
}
// --------------------------------------------------------------------------------------
// filter out values by user input
// --------------------------------------------------------------------------------------
function filter(items, percent)
{
  temp = {};

  for(var item in items) {
    if(parseFloat(items[item]["RATIO"]) >= percent)
      temp[item] = items[item];
  }

  return temp;
}
// --------------------------------------------------------------------------------------
// swap json notation keys and values
// --------------------------------------------------------------------------------------
//function swap(json)
//{
//  var ret = {};
//  
//  for(var key in json) {
//    ret[json[key]] = key;
//  }
//  
//  return ret;
//}
//// --------------------------------------------------------------------------------------
//// sort dict by ratio
//// --------------------------------------------------------------------------------------
//function sort_by_ratio(dict) {
//
//  var sorted = [];
//  for(var key in dict) {
//    sorted[sorted.length] = key;
//  }
//  
//  sorted.sort(function(a,b) { return a - b; }); // sort array by ratio
//  
//  var temp = {};
//  for(var i = 0; i < sorted.length; i++) {
//    temp[dict[sorted[i]]] = sorted[i];      // save sorted value and save in original key
//  }
//
//  return temp;
//}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

module.exports = router;
