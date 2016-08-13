var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.post('/', function(req, res, next) {
  search(req, res, respond);
});
// --------------------------------------------------------------------------------------
function search(req, res, next) {
  var dict = {};

  // debug
  console.log("req.body:");
  console.log(req.body);

  if(req.body.username == "" && req.body.mac == "")   /* no main search key was entered */
    return res.json([]);     // do not search database 

  if(req.body.username != "")
    dict["pn"] = req.body.username;
  
  if(req.body.mac != "")
    dict["csi"] = req.body.mac;
  
  if(req.body.result != "nezadáno")
    dict["result"] = req.body.result;
 
  
  // TODO
  if(req.body.from != undefined) {
    dict["timestamp"] = {};
    dict["timestamp"]["$gte"] = req.body.from;
  }
  
  if(req.body.to != undefined) {
    if(dict["timestamp"] == undefined)
      dict["timestamp"] = {};
    dict["timestamp"]["$lt"] = req.body.to;
  }
  
  // TODO - pridat razeni dle data od nejstarsiho po nejnovejsi ?

  // debug
  console.log("dict:");
  console.log(dict);

  req.db.record.find(dict, { _id: 0 }, function (err, items) {      // do not display object id in result
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
