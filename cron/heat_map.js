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
  database.logs.find({}).sort({"timestamp" : 1}).limit(1).select({"timestamp" : 1, "_id" : 0}).exec(
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
          console.error(err);
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
  curr.setHours(0);
  curr.setMinutes(0);
  curr.setSeconds(0);
  curr.setMilliseconds(0);
  var prev_min = new Date(curr);
  prev_min.setDate(prev_min.getDate() -1); // previous day hh:mm:ss:ms set to 00:00:00:000
  var prev_max = new Date(curr);           // current day hh:mm:ss:ms set to 00:00:00:000
                                           // search uses lower than max condition !
  database.realms.aggregate([ 
  { $project : { _id : 0, realm : 1 } }
  ],
  function(err, items) {
    for(var item in items)
      realms.push(items[item].realm);

    search(database, realms, prev_min, prev_max);
  });

  // new realms can be added:
  // generate_realms(database);
  // code below must be set to avoid timeouts !
  // mongoose.connect('mongodb://localhost/etlog?socketTimeoutMS=150000');
}
// --------------------------------------------------------------------------------------
// process data of 2d matrix of all realms
// --------------------------------------------------------------------------------------
function search(database, realms, min, max, done)
{
  // possible better performance with this
  // than with manual iteration ?

  database.logs.aggregate([
    { $match : { timestamp : {$gte : min, $lt : max} } },                               // match given timestamp range
    { $match : { realm : { $in : realms }, visinst : { $in : realms } } },              // limit to realms and visinst
    { $group : { _id : { realm : "$realm", visinst : "$visinst", csi : "$csi" } } },    // group by realm, visinst, csi - normalize by csi !
    { $group : { _id : { realm : "$_id.realm", visinst : "$_id.visinst" }, count : { $sum : 1 } } },    // group by realm, visinst
                                                                                        // group by realm, add each visinst and count to array
    { $group : { _id : { realm : "$_id.realm" }, institutions : { $addToSet : { realm : "$_id.visinst", count : "$count" } } } },
    { $project : { realm : "$_id.realm", institutions : 1, _id : 0 } }
  ],
    function(err, items) {
      async.forEachOf(items, function (value, key, callback) {       // loop items
        items[key].timestamp = min; // set timestamp for each record

        database.heat_map.update({ realm : items[key].realm, timestamp: items[key].timestamp }, items[key], { upsert : true },
        function(err, result) {
          if(err)  
            console.error(err);

          callback(null);   // continue
        });
      },
      function (err) {
        if (err)
          console.error(err);

        if(done)      // callback is defined
          done(null, null);
      });
    });
}
// --------------------------------------------------------------------------------------
// generate realm list for realms collection
// to use this
// db connection must be set:
// mongoose.connect('mongodb://localhost/etlog?socketTimeoutMS=150000');
// because query takes long time !
// --------------------------------------------------------------------------------------
function generate_realms(database)
{
  var realm_list = [];

  // possible TODO - remove limitation just to .cz

  database.logs.aggregate([ 
    { $match : { realm : /.*\.cz$/, result : "OK" } },
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
            console.error(err);
        });
      }
  });

  // =========================================

  var visinst_list = [];

  database.logs.aggregate([
    { $match : { visinst : /.*\.cz$/, result : "OK" } },
    { $project : { visinst : { $toLower : "$visinst" } } },   // use lower case to match all possible visinst forms
    { $group : { _id : { visinst : "$visinst" } } },
    { $project : { visinst : "$_id.visinst", _id : 0 } }
  ],
    function(err, items) {
      for(var item in items)
        visinst_list.push(items[item].visinst);

      for(visinst in visinst_list) {
        database.realms.update({ realm : visinst_list[visinst] }, { realm : visinst_list[visinst] }, { upsert : true },
        function(err, result) {
          if(err)
            console.error(err);
        });
      }
  });
}
// --------------------------------------------------------------------------------------
module.exports = exp;
