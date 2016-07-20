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

  req.db.record.find({result : "FAIL"}, { _id: 0 }, function (err, items) {      // do not display object id in result
    respond(err, items, res)
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
// --------------------------------------------------------------------------------------

module.exports = router;
