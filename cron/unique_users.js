const async = require( 'async' );
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process old data through days until current day 
// get roaming collection data
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

    async.whilst(function () {
      return min < curr_min;
    },
    function(next) {
      async.series([
        function(done) {
          process_data(database, min, max, done);     // calls done when finished
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
        console.log("cron task unique_users finished processing old data");
      callback(null, null);
    });
  });
};
// --------------------------------------------------------------------------------------
// function for current data
// get roaming collection data
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var curr = new Date();        // current day
  curr.setHours(0);
  curr.setMinutes(0);
  curr.setSeconds(0);
  curr.setMilliseconds(0);
  var prev_min = new Date(curr);
  prev_min.setDate(prev_min.getDate() -1); // previous day hh:mm:ss:ms set to 00:00:00:000
  var prev_max = new Date(curr);           // current day hh:mm:ss:ms set to 00:00:00:000
                                           // search uses lower than max condition !
  process_data(database, prev_min, prev_max);
};
// --------------------------------------------------------------------------------------
function process_data(database, min_date, max_date, done)
{
  async.series([
    function(finished) {
      get_realms(database, min_date, max_date, finished);
    },
    function(finished) {
      get_visinst(database, min_date, max_date, finished);
    }
    ],
    function(err, results) {
      if(done)  // no callback needed for current data
        done(null);                      // both most_provided and most_used are done
  });
}
// --------------------------------------------------------------------------------------
// get data for realms
// --------------------------------------------------------------------------------------
function get_realms(database, min, max, done)
{
  database.logs.aggregate([ 
    { $match : { timestamp : { $gte : min, $lt : max }, result : "OK" } },    // limit by timestamp and result
    { $project : { realm : 1, csi : 1 } },                      // limit to realm, csi
    { $group : { _id : { realm : "$realm" }, addrs : { $addToSet : "$csi" } } },    // group by realm, add mac addresses to array
    { $project : { realm : "$_id.realm", realm_addrs : "$addrs", _id : 0 } },
  ],
    function(err, items) {
      if(err == null) {
        if(done)    // processing older data
          save_to_db_callback(database, transform(items, min), done);
        else    // current data processing, no callback is needed
          save_to_db(database, transform(items, min));
      }
      else
        console.error(err);
  });
}
// --------------------------------------------------------------------------------------
// save data to database
// --------------------------------------------------------------------------------------
function save_to_db(database, items)
{
  for(var item in items) {  // any better way to do this ?
    database.unique_users.update({ timestamp : items[item].timestamp, realm : items[item].realm }, items[item], { upsert : true },
    function(err, result) {
      if(err)
        console.error(err);
    });
  }
}
// --------------------------------------------------------------------------------------
// save data to database with callback
// --------------------------------------------------------------------------------------
function save_to_db_callback(database, items, done) {
  async.forEachOf(items, function (value, key, callback) {
    database.unique_users.update({ timestamp : items[key].timestamp, realm : items[key].realm }, items[key], { upsert : true },
    function(err, result) {
      if(err)
        console.error(err);
      callback(null);   // save next item
    });
  }, function (err) {
    if (err)
      console.error(err);
    done(null, null);   // all items are saved
  });
}
// --------------------------------------------------------------------------------------
// transform data for saving to database
// --------------------------------------------------------------------------------------
function transform(items, db_date)
{
  var arr = [];

  for(var item in items) {
    items[item].timestamp = db_date;
    arr.push(items[item]);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
// get data for visinst
// --------------------------------------------------------------------------------------
function get_visinst(database, min, max, done)
{
  database.logs.aggregate([ 
    { $match : { timestamp : { $gte : min, $lt : max }, result : "OK" } },    // limit by timestamp and result
    { $project : { visinst : 1, csi : 1 } },                      // limit to visinst, csi
    { $group : { _id : { visinst : "$visinst" }, addrs : { $addToSet : "$csi" } } },    // group by visinst, add mac addresses to array
    { $project : { realm : "$_id.visinst", visinst_addrs : "$addrs", _id : 0 } },
  ],
    function(err, items) {
      if(err == null) {
        if(done)    // processing older data
          save_to_db_callback(database, transform(items, min), done);
        else    // current data processing, no callback is needed
          save_to_db(database, transform(items, min));
      }
      else
        console.error(err);
  });
}
// --------------------------------------------------------------------------------------
module.exports = exp;
