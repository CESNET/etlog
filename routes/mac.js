var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res) {
  res.render('mac', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
});
// --------------------------------------------------------------------------------------
router.post('/search', function(req, res) {
  search(req, res, respond);
});
// --------------------------------------------------------------------------------------
function search(req, res) {
  req.db.record.aggregate(  // search db
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
    $group :                // group by pair [ username, mac_address ]
      { 
        _id : 
          { 
            pn : "$pn", csi : "$csi" 
          } 
      } 
  },  
  { 
    $group :                // group again by username
      { 
        _id : 
          { 
            pn : "$_id.pn" 
          }, 
        count : 
          { 
            $sum :  1       // count number of occurences
          } 
      } 
  }, 
  { 
    $match :                // match
      { 
        count : 
          { 
            $gt : 2         // more than 2 mac addresses
          } 
      } 
  } , 
  { 
    $sort :                 // sort from highest to lowest
    { 
      count : -1  
    }
  } 
  ],
    function(err, items) {
      if(err == null)
        items = filter(items);

      //console.log(items);

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
  
  // debug
  //console.log(items);

  res.json(items);
}
// --------------------------------------------------------------------------------------
function filter(items)
{
  dict = {};

  for(var item in items) {
    var key = items[item];
    dict[key._id.pn] = key.count    // save count on username
  }

  return dict;
}
// --------------------------------------------------------------------------------------
module.exports = router;
