var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  console.log(req);
  //console.log(req.server);
  //console.log(req.query);   // debug
  //console.log(req.headers);   // debug
  //console.log(req.headers.cookie);
  //console.log(typeof(req.headers.cookie));

  //var url = require('url');
  //var url_parts = url.parse(req.url, true);
  //var query = url_parts.query;

  //console.log(url_parts);
  //console.log(query);


  //res.render('index', { title: 'testovaci autentizace' });
  res.send('autentizace probehla v poradku');

  //var color = req.param('color');

});

module.exports = router;
