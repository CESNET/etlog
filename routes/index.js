const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  res.render('index', { title: 'etlog', username : req.header("REMOTE_USER"),
  headers : JSON.stringify(req.headers).replace(/,/g, "\n") });
});
// --------------------------------------------------------------------------------------
module.exports = router;
