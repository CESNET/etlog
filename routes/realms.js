const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
// get all data from realms collection
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  req.db.realms.aggregate([ { $sort : { realm : 1 } },  // sort alphabetically
  { $project : { realm : 1, _id : 0 } } ],
  function(err1, items) {
      if(err1) {
        var err2 = new Error();      // just to detect where the original error happened
        console.error(err2);
        console.error(err1);
        next([err2, err1]);
        return;
      }

      respond(convert(items), res);
   });
});
// --------------------------------------------------------------------------------------
// convert dict to array
// --------------------------------------------------------------------------------------
function convert(data)
{
  var res = [];

  for(var item in data) {
    res.push(data[item].realm);
  }

  return res;
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
