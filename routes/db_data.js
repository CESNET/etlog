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
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.logs.min = doc[0].timestamp;
      });
      
      req.db.logs.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.logs.max = doc[0].timestamp;
        done(null);
      });
    },
    function(done) {
      req.db.mac_count.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.mac_count.min = doc[0].timestamp;
      });
      
      req.db.mac_count.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.mac_count.max = doc[0].timestamp;
        done(null);
      });
    },
    function(done) {
      req.db.roaming.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.roaming.min = doc[0].timestamp;
      });
      
      req.db.roaming.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.roaming.max = doc[0].timestamp;
        done(null);
      });
    },
    function(done) {
      req.db.failed_logins.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.failed_logins.min = doc[0].timestamp;
      });
      
      req.db.failed_logins.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.failed_logins.max = doc[0].timestamp;
        done(null);
      });
    },
    function(done) {
      req.db.shared_mac.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.shared_mac.min = doc[0].timestamp;
      });
      
      req.db.shared_mac.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.shared_mac.max = doc[0].timestamp;
        done(null);
      });
    },
    function(done) {
      req.db.heat_map.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.heat_map.min = doc[0].timestamp;
      });
      
      req.db.heat_map.aggregate([ { $sort : { timestamp : 1 } }, { $limit : 1 },
      { $project : { timestamp : { $add : [ "$timestamp", 7200000 ] }, _id : 0 } } ],    // convert UTC to localtime
      function(err, doc) {
        ret.heat_map.max = doc[0].timestamp;
        done(null);
      });
    },
    ],
    function(err, results) {
      respond(err, ret, res);
  });
});
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
