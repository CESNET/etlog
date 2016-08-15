var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  res.render('inst_roaming', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
});
// --------------------------------------------------------------------------------------
router.post('/search', function(req, res, next) {
  search(req, res, respond);
});
// --------------------------------------------------------------------------------------
function search(req, res) {
  
  // TODO - timestamp
  
  min_date = new Date("2015-04-23T00:00:00Z");
  max_date = new Date(min_date.getTime() + 86400000);

  req.db.logs.aggregate(
  [ 
  { 
    $match : 
      { 
        timestamp : 
          { 
            $gte : min_date,         // TODO
            $lt : max_date 
          }, 
        result : "OK",          // match only successful logins
        visinst : 
          { 
            $ne : "UNKNOWN"       // no unknown institutions
          }
      } 
  },  
  { 
    $group :                    // group by pair [visinst, csi ] - normalization by mac address
      {
        _id : 
          { 
            visinst : "$visinst", 
            csi : "$csi" 
          } 
      } 
  },
  { 
    $project : 
    { 
      "_id.visinst" : 1              // we want only visinst
    } 
  }, 
  { 
    $group :                   // group by visinst
      { 
        _id : 
          { 
            visinst : "$_id.visinst" 
          }, 
        count : 
          { 
            $sum : 1           // count number of current visinst
          } 
      } 
  }, 
  { 
    $sort :                    // sort from lowest to highest
    { 
      count : 1
    } 
  }   
  ],
    function(err, items) {
      if(err == null)
        items = filter(items);

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
function filter(items)
{
  dict = {};

  for(var item in items) {
    var key = items[item];
    dict[key._id.visinst] = key.count    // save count to visinst
  }

  return dict;
}
// --------------------------------------------------------------------------------------
module.exports = router;
