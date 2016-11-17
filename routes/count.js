const express = require('express');
const router = express.Router();
const qp = require('./query_parser');
// --------------------------------------------------------------------------------------
// get count for mac count
// --------------------------------------------------------------------------------------
router.get('/mac_count', function(req, res, next) {
  try {
    var query = get_timestamp(req);
  }
  catch(error) {
    var err = new Error(error.error);
    err.status = 400;
    next(err);
    return;
  }

  get_record_count(req.db.mac_count, res, next, query);       // perform search with constructed mongo query
});
// --------------------------------------------------------------------------------------
// get mongo query from timestamp values
// --------------------------------------------------------------------------------------
function get_timestamp(req)
{
  var query = qp.parse_query_string(req.url,
    ['timestamp'],        // timestamp only
    qp.validate_days);

  return query;
}
// --------------------------------------------------------------------------------------
// return count of record for specified timestamp interval
// --------------------------------------------------------------------------------------
function get_record_count(collection, res, next, query)
{
  collection.find(query.filter)
  .count(function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    };

    respond(items, res)
  });
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
