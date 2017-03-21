const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
// get count for mac count
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  req.db.concurrent_rev.find({}, { _id : 0, revisions : 1 }, function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err1);
      console.error(err2);
      next([err2, err1]);
      return;
    }

    respond(items[0].revisions, res);
  });
});
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
