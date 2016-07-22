var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.post('/', function(req, res) {
  search(req, res, respond);
});
// --------------------------------------------------------------------------------------
function search(req, res) {
  var dict = {};

  // debug
  console.log("req.body:");
  console.log(req.body);

  if(req.body.percent == "")   /* no main search key was entered */
    return res.json([]);     // do not search database 

    dict["percent"] = req.body.percent;

  // debug
  console.log("dict:");
  console.log(dict);

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
        items = sort(transform(items));

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
//
// --------------------------------------------------------------------------------------
function transform(items)
{
  dict = {};

  for(var item in items) {
    var key = items[item];
    dict[key._id.pn] = {};     // key in is the "PN" attribute

    for(var i = 0; i < key.results.length; i++)
      dict[key._id.pn][key.results[i]] = key.result_count[i]; // set key [FAIL, OK] for related count
                                                                // OK count could be 0 - empty key and value
  }

  return dict;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function sort(items)
{

  return items;
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

module.exports = router;
