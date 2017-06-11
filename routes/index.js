const express = require('express');
const router = express.Router();
const user = require('./user_common');
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  if(!req.session.user)
    req.session.user = user.get_user(req);

  res.render('index', { title: 'etlog' });
});
// --------------------------------------------------------------------------------------
module.exports = router;
