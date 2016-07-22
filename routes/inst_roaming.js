var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res) {
  res.render('inst_roaming', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
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
        result : "OK",         // match only successful logins
        visinst :              // no unknown institutions
          { 
            $ne : "UNKNOWN" 
          } 
      } 
  },  
  { 
    $project : 
    { 
      visinst : 1              // we want only visinst
    } 
  }, 
  { 
    $group :                   // group by visinst
      { 
        _id : 
          { 
            visinst : "$visinst" 
          }, 
        count : 
          { 
            $sum : 1           // count number of current visinst
          } 
      } 
  }, 
  { 
    $sort :                    // sort from highest to lowest
    { 
      count : -1 
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
