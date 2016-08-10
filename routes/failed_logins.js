var express = require('express');
var router = express.Router();
// -----------------------------------------------------------------
router.get('/', function(req, res, next) {
  res.render('failed_logins', { title: 'vyhledávání neúspěšných pokusů o ověření' });
});
module.exports = router;
