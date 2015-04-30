var express = require('express');
var router = express.Router();

/*
* GET mac address
*/
router.get('/:mac_addr', function(req, res) {
  req.db.record.find({"csi" : req.params.mac_addr}, function (err, items) {
    if(err)
      res.send(err);

    res.json(items);
  });
});

/*
* GET mac + result
*/
router.get('/:mac_addr/results/:result', function(req, res) {
  req.db.record.find({"csi" : req.params.mac_addr, "result" : req.params.result}, function (err, items) {
    if(err)
      res.send(err);

    res.json(items);
  });
});


module.exports = router;
