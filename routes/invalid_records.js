var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
// get invalid records for specific date
router.get('/:date', function(req, res, next) {
  // TODO
  
  // TODO - validation
  console.log(req.params);

  

  var min = new Date(req.params.date);  
  min.setHours(0);
  min.setMinutes(0);
  min.setSeconds(0);
  min.setMilliseconds(0);  // set to 00:00:00:000
  
  var max = new Date(min);
  max.setDate(max.getDate() + 1);  // set to next day 00:00:00:000

  console.log(min);
  console.log(max);
  console.log(new Date());

  req.db.invalid_records.aggregate([
  {
    $match :
      { 
        timestamp :         // get data for one day
          { 
            $gte : min, 
            $lt : max 
          }
      } 
  },
  { 
    $project :
      {
        _id : 0, 
        records : 1     // get only records
      }
  }
  ], function (err, items) {
    respond(err, items, res)
  });
});
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
module.exports = router;
