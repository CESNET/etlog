var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('test', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
});

module.exports = router;
