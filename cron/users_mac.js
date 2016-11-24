const async = require( 'async' );
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process old data through days until current day 
// --------------------------------------------------------------------------------------
// map usernames to mac addresses
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
      return min <= curr_min;       // process data for current day !
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
        console.log("cron task users_mac finished processing old data");
      callback(null, null);
    });
  });
};
// --------------------------------------------------------------------------------------
// function for current data
// interval must be the same interval at which the task is running periodically!
// interval is in seconds
// --------------------------------------------------------------------------------------
// map usernames to mac addresses
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database, interval) {
  max_date = new Date();        // current day
  // current day [hh:mm:ss] - ((interval * miliseconds) + something just to be sure, we dont miss any records * miliseconds)
  min_date = new Date(max_date.getTime() - ((interval * 1000) + (interval / 4) * 1000 ));

  process_data(database, min_date, max_date);
};
// --------------------------------------------------------------------------------------
// search the database for given time interval
// --------------------------------------------------------------------------------------
function process_data(database, min_date, max_date, done)
{
  database.logs.aggregate([ 
    { 
      $match : 
        {
          timestamp :             // get only data for current day
            {
              $gte : min_date, 
              $lt : max_date 
            }, 
          pn : 
            { 
              $ne : ""            // only non empty usernames
            }
            , 
          // data can contain records where one mac address is empty for certain username, we do not want to includes these records here
          // at this point generated data may be inconsistent with mac_count because of empty mac addresses
          // but it is neccessary to not allow empty addresses in here!
          csi :
            {
              $ne : ""            // only non empty mac addresses
            },
          result : "OK"           // only successfully authenticated users
        } 
    }, 
    { 
      $project :                  // need only username and mac address
        { 
          pn : 1, 
          csi : 1 
        } 
    }, 
    { 
      $group :                    // group by pair [ username, mac address ]
        { 
          _id : 
            { 
              pn : "$pn", 
              csi : "$csi" 
            } 
        } 
    }, 
    { 
      $group :                    // group again by username
        { 
          _id : 
            { 
              pn : "$_id.pn" 
            }, 
          addrs :
            {
              $addToSet : "$$ROOT._id.csi"  // add mac addresses for matching username to array
            }
        } 
    }
    ],
    function(err, items) {
      if(err == null) {
        if(done)    // processing older data
          transform_callback(items, database, done);
        else    // current data processing, no callback is needed
          transform(items, database);
      }
      else
        console.error(err);
    });
}
// --------------------------------------------------------------------------------------
// transform data and update database
// --------------------------------------------------------------------------------------
function transform(items, database)
{
  dict = {};

  for(var item in items) {
    var key = items[item];
    dict["username"] = key._id.pn;  // save username
    dict["addrs"] = key.addrs;  // save array of mac addressses

    database.users_mac.update(
      {                                 // query
        "username" : dict["username"]
      },
      {                                 // update
        "username" : dict["username"],  // set username
        $addToSet :                     // add mac addresses to array
          {
            "addrs" : 
              { 
                $each : dict["addrs"]   // each one separately not whole array
              }     
          } 
      },
      { 
        upsert : true                   // update if matching document is found
      }, 
      function (err, result) {
        if(err)
          console.error(err);
        // nothing more to do here
    });
  }
}
// --------------------------------------------------------------------------------------
// transform data and update database with callback
// --------------------------------------------------------------------------------------
function transform_callback(items, database, done)
{
  dict = {};

  async.forEachOf(items, function (value, key, callback) {
    dict["username"] = items[key]._id.pn;  // save username
    dict["addrs"] = items[key].addrs;  // save array of mac addressses

    database.users_mac.update(
      {                                 // query
        "username" : dict["username"]
      },
      {                                 // update
        "username" : dict["username"],  // set username
        $addToSet :                     // add mac addresses to array
          {
            "addrs" :
              {
                $each : dict["addrs"]   // each one separately not whole array
              }
          }
      },
      {
        upsert : true                   // update if matching document is found
      },
      function (err, result) {
        if(err)
          console.error(err);
        callback(null);   // process next item
    });
  }, function (err) {
    if (err)
      console.error(err);
    done(null, null);   // all items are saved
  });
}
// --------------------------------------------------------------------------------------
module.exports = exp;
