const express = require('express');
const router = express.Router();
const async = require( 'async' );
// --------------------------------------------------------------------------------------
// get all database collections (with timestamp info) min and max date
// => data timestamp range for all collections (with timestamp info)
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  var ret = {};
  ret.logs = {};
  ret.mac_count = {};
  ret.roaming = {};
  ret.failed_logins = {};
  ret.shared_mac = {};
  ret.heat_map = {};

  async.series([
    function(done) {
      req.db.logs.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.logs.min = convert(doc[0].timestamp).toISOString();
      });
      
      req.db.logs.aggregate([ { $sort : { timestamp : -1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.logs.max = convert(doc[0].timestamp).toISOString();
        done(null);
      });
    },
    function(done) {
      req.db.mac_count.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.mac_count.min = convert(doc[0].timestamp).toISOString();
      });
      
      req.db.mac_count.aggregate([ { $sort : { timestamp : -1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.mac_count.max = convert(doc[0].timestamp).toISOString();
        done(null);
      });
    },
    function(done) {
      req.db.roaming.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.roaming.min = convert(doc[0].timestamp).toISOString();
      });
      
      req.db.roaming.aggregate([ { $sort : { timestamp : -1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.roaming.max = convert(doc[0].timestamp).toISOString();
        done(null);
      });
    },
    function(done) {
      req.db.failed_logins.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.failed_logins.min = convert(doc[0].timestamp).toISOString();
      });
      
      req.db.failed_logins.aggregate([ { $sort : { timestamp : -1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.failed_logins.max = convert(doc[0].timestamp).toISOString();
        done(null);
      });
    },
    function(done) {
      req.db.shared_mac.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.shared_mac.min = convert(doc[0].timestamp).toISOString();
      });
      
      req.db.shared_mac.aggregate([ { $sort : { timestamp : -1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.shared_mac.max = convert(doc[0].timestamp).toISOString();
        done(null);
      });
    },
    function(done) {
      req.db.heat_map.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.heat_map.min = convert(doc[0].timestamp).toISOString();
      });
      
      req.db.heat_map.aggregate([ { $sort : { timestamp : -1 } }, { $limit : 1 },
      { $project : { timestamp : 1, _id : 0 } } ],
      function(err, doc) {
        ret.heat_map.max = convert(doc[0].timestamp).toISOString();
        done(null);
      });
    },
    ],
    function(err, results) {
      respond(err, ret, res);
  });
});
// --------------------------------------------------------------------------------------
// convert UTC to localtime based on input
// --------------------------------------------------------------------------------------
function convert(date)
{
  d = new Date(date);
  d.setTime(d.getTime() + (-1 * d.getTimezoneOffset() * 60 * 1000));
  return d;
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err) {
    console.error(err);
    res.send(err);
    return;
  }
  
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
