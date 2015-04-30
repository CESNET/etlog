var express = require('express');
var router = express.Router();

/*
* GET user, mac and result
*/
router.get('/:username/mac/:mac_addr/results/:result', function(req, res) {
  req.db.record.find({"pn" : req.params.username, "csi" : req.params.mac_addr, "result" : req.params.result }, function (err, items) {
    if(err)
      res.send(err);

    res.json(items);
  });
});

/*
* GET user and mac
*/
router.get('/:username/mac/:mac_addr', function(req, res) {
  req.db.record.find({"pn" : req.params.username, "csi" : req.params.mac_addr}, function (err, items) {
    if(err)
      res.send(err);

    res.json(items);
  });
});

/*
* GET user and mac
*/
router.get('/:username/results/:result', function(req, res) {
  req.db.record.find({"pn" : req.params.username, "result" : req.params.result}, function (err, items) {
    if(err)
      res.send(err);

    res.json(items);
  });
});


module.exports = router;
