const express = require('express');
const router = express.Router();
const aqp = require('api-query-params').default;    // uses ES6
// --------------------------------------------------------------------------------------
// get failed records for specific date
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var query = aqp(req.query, {          // parse query string
    whitelist : [ 'username', 'timestamp', 'fail_count', 'ok_count', 'ratio' ]       // whitelist collection variables
  });

  // TODO - validation !!
  // TODO - another interval than day !!
  // TODO - check that timestamp is present
  // do not search otherwise

  search(req, res, respond, query);
});
// --------------------------------------------------------------------------------------
// search database for specified data
// --------------------------------------------------------------------------------------
function search(req, res, respond, query) {
  req.db.failed_logins.find(query.filter,  { _id : 0, timestamp : 0}, function(err, items) {
    respond(err, items, res)
  });
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err) {
    console.log(err);
    res.send(err);
    return;
  }
  
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
