var express = require('express');
var router = express.Router();

  // example
  // "00c2c64c955f"


/*
* GET specific mac address
*/
router.get('/:mac_addr_id', function(req, res) {
  req.db.record.find({"csi" : req.params.mac_add_id}, function (err, items) {
    if(err)
      res.send("zadana mac adresa nenalezena");

    res.json(items);
  });
});


module.exports = router;
