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
  //if(req.body.username != "")
  //  dict["pn"] = req.body.username;
  //
  //if(req.body.username != "")
  //  dict["pn"] = req.body.username;
  

  // debug
  console.log(dict);

  req.db.record.find(dict, { _id: 0 }, function (err, items) {      // do not display object id in result
    respond(err, items, res)
  });
}
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err)
    res.send(err);
  
  // debug
  //console.log(items);

  res.json(items);
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

module.exports = router;
