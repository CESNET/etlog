const async = require( 'async' );
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// perform successful logins counting
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
          search(database, min, max, done);     // calls done when finished
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
        console.log("cron task succ_logins finished processing old data");
      callback(null, null);
    });
  });
};
// --------------------------------------------------------------------------------------
// perform successful logins counting
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
  search(database, prev_min, prev_max);
};
// --------------------------------------------------------------------------------------
// perform database search
// --------------------------------------------------------------------------------------
function search(database, min, max, done) {
  database.logs.aggregate(
  [ 
  { 
    $match : 
      { 
        timestamp :         // get data for one day
          { 
            $gte : min, 
            $lt : max 
          }, 
        pn : 
          { 
            $ne : ""        // no empty usernames
          }, 
        result : "OK"
      } 
  }, 
  { 
    $project : 
      { 
        csi : 1, pn : 1    // limit to csi and pn
      } 
  },  
  { 
    $group :                                // group by [ csi, pn ]
    { 
      _id : 
      { 
        pn : "$pn",
        csi : "$csi"
      }, 
      count :                               // count number of occurences
      { 
        $sum : 1 
      } 
    } 
  },
  { $group : { _id : { pn : "$_id.pn" }, count : { $sum : "$count" } }, },      // group again by username
  { $project : { username : "$_id.pn", count : 1, _id : 0 } }
  ], 
    function (err, items) {
      if(err == null) {
        if(done)    // processing older data
          save_to_db_callback(database, transform(items, min), done);
        else    // current data processing, no callback is needed
          save_to_db(database, transform(items, min));    // add timestamp in transform
      }
      else
        console.error(err);
  });
}
// --------------------------------------------------------------------------------------
// save data to database
// --------------------------------------------------------------------------------------
function save_to_db(database, items) {
  for(var item in items) {  // any better way to do this ?
    database.succ_logins.update(items[item], items[item], { upsert : true },
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
    database.succ_logins.update(items[key], items[key], { upsert : true },
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
// add timestamp to every record
// --------------------------------------------------------------------------------------
function transform(items, db_date) {
  var arr = [];

  for(var item in items) {
    items[item].timestamp = db_date;
    arr.push(items[item]);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
module.exports = exp;

