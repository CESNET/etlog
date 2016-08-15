var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  res.render('roaming', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
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
            $gte : min_date, 
            $lt : max_date 
          }, 
        result : "OK"         // only successfully authenticated users
      } 
  },  
  {
    $group :                  // group by pair [realm, csi] - normalization by mac address
    { 
      _id : 
        { 
          realm : "$realm", 
          csi : "$csi" 
        } 
    } 
  },
  { 
    $project : 
      { 
        "_id.realm" : 1             // we need only realm
      } 
  }, 
  { 
    $group :                // group by realm
      { 
        _id : 
          { 
            realm : "$_id.realm" 
          }, 
        count : 
          { 
            $sum : 1        // count number of records for given realm
          } 
      } 
  }, 
  { 
    $sort :                 // sort from lowest to highest
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
    dict[key._id.realm] = key.count    // save count to realm
  }

  return dict;
}
// --------------------------------------------------------------------------------------
module.exports = router;
