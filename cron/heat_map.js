const async = require( 'async' );
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// perform heat map data counting
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database, callback) {
  // find the lowest date in database and go from that date to present
  var date;
  var current = new Date();
  var curr_min = new Date(current.getFullYear(), current.getMonth(), current.getUTCDate(), 0, 0, 0, 0);   // current day hh:mm:ss:ms set to 00:00:00:000

  // find all, sort by timestamp, display only timestamp, display one document only
  database.logs.find({ query : {}, $orderby : { timestamp : 1 } } , { timestamp : 1, _id : 0 }, { limit : 1 },
  function(err, doc) {
    var date = doc;

    date = String(date[0]["timestamp"]);    // get only string representation of date

    var fields = date.split(" ");
    var months = {      // months dict for date constructor
      "Jan" : 0,
      "Feb" : 1,
      "Mar" : 2,
      "Apr" : 3,
      "May" : 4,
      "Jun" : 5,
      "Jul" : 6,
      "Aug" : 7,
      "Sep" : 8,
      "Oct" : 9,
      "Nov" : 10,
      "Dec" : 11
    }

    var min = new Date(fields[3], months[fields[1]], fields[2], 0, 0, 0, 0);        // hh:mm:ss:ms set to 0
    var max = new Date(fields[3], months[fields[1]], Number(fields[2]) + 1, 0, 0, 0, 0);    // next day, hh:mm:ss:ms set to 0
                                                                                    // search uses lower than max condition !
    // this date handling should guarantee correct interval for all processed records

    // set up data for search
    realms = [];

    async.series([
      function(done) {
        database.realms.aggregate([
        { $project : { _id : 0, realm : 1 } }
        ],
        function(err, items) {
          for(var item in items)
            realms.push(items[item].realm);
          done(null)
        });
      }
    ],
      function(err, results) {

      // ---------------------------------------------------
      async.whilst(function () {
        return min < curr_min;
      },
      function(next) {
        async.series([
          function(done) {
            search(database, realms, min, max, done);     // calls done when finished
          },
          function(done) {
            min.setDate(min.getDate() + 1);  // continue
            max.setDate(max.getDate() + 1);  // continue
            done(null);                      // done
          }
          ],
          function(err, results) {
            next();   // next whilst iteration
        });
      },
      function(err) {
        if(err)
          console.log(err);
        else
          console.log("cron task heat map finished processing old data");
        callback(null, null);
      });
    });
  });
};
// --------------------------------------------------------------------------------------
// perform heat map data counting
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database)
{
  var realms = [];
  
  var curr = new Date();        // current day
  var prev_min = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate() - 1, 0, 0, 0, 0); // previous day hh:mm:ss:ms set to 00:00:00:000
  var prev_max = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate(), 0, 0, 0, 0);     // current day hh:mm:ss:ms set to 00:00:00:000
                                                                                                   // search uses lower than max condition !
  database.realms.aggregate([ 
  { $project : { _id : 0, realm : 1 } }
  ],
  function(err, items) {
    for(var item in items)
      realms.push(items[item].realm);

    search(database, realms, prev_min, prev_max);
  });
}
// --------------------------------------------------------------------------------------
// process data of 2d matrix of all realms
// --------------------------------------------------------------------------------------
function search(database, realms, min, max, done)
{
  async.forEachOf(realms, function (value_src, key_src, callback_src) {         // loop realms as source
    var item = {};              // database item
    item.inst_name = realms[key_src];
    item.timestamp = min;
    item.institutions = [];
  
    async.forEachOf(realms, function (value_dst, key_dst, callback_dst) {       // loop realms as destination
      database.logs.aggregate([ 
        { $match : { realm : realms[key_src], visinst : realms[key_dst],          // search for source and destination
          timestamp : { $gte : min, $lt : max } } },                              // get data for one day
        { $group : { _id : { visinst : "$visinst" }, count : { $sum : 1 } } },
        { $project : { count : 1, _id : 0  } }
      ],
        function(err, items) {
          if(items.length != 0) {  // non empty result
            item.institutions.push({ inst_name : realms[key_dst], count : items[0].count}); // add to array
          }
          callback_dst(null);
      });
    }, function (err) {
      if (err)
        console.log(err);
      else {
        // save item
        database.heat_map.update({ inst_name : item.inst_name, timestamp: item.timestamp }, item, { upsert : true },
        function(err, result) {
          if(err)  
            console.log(err);
          callback_src(null);       // continue when record is saved
        });
      }
    });
  }, function (err) {
    if (err)
      console.log(err);
    if(done) {      // callback is defined
      done(null, null);
    }
  });
}
// --------------------------------------------------------------------------------------
// generate realm list for realms collection
// --------------------------------------------------------------------------------------
function generate_realms(database)
{
  var realm_list = [];

  // possible TODO - remove limitation just to .cz

  database.logs.aggregate([ 
    { $match : { realm : /.*\.cz$/ } }, 
    { $project : { realm : { $toLower : "$realm" } } },   // use lower case to match all possible realm forms
    { $group : { _id : { realm : "$realm" } } }, 
    { $project : { realm : "$_id.realm", _id : 0 } } 
  ],
    function(err, items) {
      for(var item in items)
        realm_list.push(items[item].realm);

      for(realm in realm_list) {
        database.realms.update({ realm : realm_list[realm] }, { realm : realm_list[realm] }, { upsert : true },
        function(err, result) {
          if(err)  
            console.log(err);
        });

      }
  });
}
module.exports = exp;
