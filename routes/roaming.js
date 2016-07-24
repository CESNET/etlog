var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res) {
  res.render('roaming', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
});
// --------------------------------------------------------------------------------------
router.post('/search', function(req, res) {
  search(req, res, respond);
});
// --------------------------------------------------------------------------------------
function search(req, res) {

  req.db.record.aggregate(
  [ 
  { 
    $match : 
    { 
      result : "OK"         // only successfully authenticated users
    } 
  },  
  { 
    $project : 
    { 
      realm : 1             // we need only realm
    } 
  }, 
  { 
    $group :                // group by realm
      { 
        _id : 
          { 
            realm : "$realm" 
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

  console.log(items);

  for(var item in items) {
    var key = items[item];
    dict[key._id.realm] = key.count    // save count to realm
  }

  return dict;
}
// --------------------------------------------------------------------------------------
module.exports = router;
