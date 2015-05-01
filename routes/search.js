var express = require('express');
var router = express.Router();

// --------------------------------------------------------------------------------------
/*
* POST to search - all input values in request in json
*/
router.post('/', function(req, res) {

  // debug
  console.log(req.body);
  console.log(req.body.username);
  console.log(req.body.mac);
  console.log(req.body.result);


  search(req, res, respond);
});

// --------------------------------------------------------------------------------------

function search(req, res) {
  var dict = {};

  if(req.body.username != "")
    dict["pn"] = req.body.username;
  
  if(req.body.mac != "")
    dict["csi"] = req.body.mac;
  
  if(req.body.result != "")
    dict["result"] = req.body.result;
 
  
  // TODO
  //if(req.body.username != "")
  //  dict["pn"] = req.body.username;
  //
  //if(req.body.username != "")
  //  dict["pn"] = req.body.username;
  

  // debug
  console.log(dict);

  req.db.record.find(dict, function (err, items) {
    respond(err, items, res)
  });
}

// --------------------------------------------------------------------------------------

function respond(err, items, res) {
  if(err)
    res.send(err);
  
  res.json(items);
}

// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

module.exports = router;
