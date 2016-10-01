const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
// get invalid records for specific date
router.get('/:date', function(req, res, next) {
  if(isNaN(Date.parse(req.params.date))) {  // validate date
    res.end("invalid date: " + req.params.date);
    return;
  }
  
  var date = new Date(req.params.date);  
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);  // set to 00:00:00:000
  
  req.db.invalid_records.aggregate([
  {
    $match :
      { 
        timestamp : date
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
