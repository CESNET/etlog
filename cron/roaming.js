// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process old data through days until current day 
// get roaming collection data
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database) {
  // find the lowest date in database and go from that date to present
  var date;
  var current = new Date();

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

    while(min <= current) {
      process_data(database, min, max);
      min.setDate(min.getDate() + 1);  // continue
      max.setDate(max.getDate() + 1);  // continue
    }
    console.log("cron task roaming finished processing old data");
  });
};
// --------------------------------------------------------------------------------------
// function for current data
// get roaming collection data
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var curr = new Date();        // current day
  var prev_min = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate() - 1, 0, 0, 0, 0); // previous day hh:mm:ss:ms set to 00:00:00:000
  var prev_max = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate(), 0, 0, 0, 0);     // current day hh:mm:ss:ms set to 00:00:00:000
                                                                                                   // search uses lower than max condition !
  process_data(database, prev_min, prev_max);
};
// --------------------------------------------------------------------------------------
function process_data(database, min_date, max_date)
{
  get_most_provided(database, min_date, max_date);
  get_most_used(database, min_date, max_date);
}
// --------------------------------------------------------------------------------------
// get data for organisations most providing roaming
// --------------------------------------------------------------------------------------
function get_most_provided(database, min_date, max_date)
{
  database.logs.aggregate(
  [ 
  { 
    $match : 
      { 
        timestamp : 
          {
            $gte : min_date, 
            $lt : max_date 
          }, 
        result : "OK"         // only successfully authenticated users
      } 
  },  
  {
    $group :                  // group by pair [realm, csi] - normalization by mac address
      { 
        _id : 
          { 
            realm : "$realm", 
            csi : "$csi" 
          } 
      } 
  },
  { 
    $project : 
      { 
        "_id.realm" : 1             // we need only realm
      } 
  }, 
  { 
    $group :                // group by realm
      { 
        _id : 
          { 
            realm : "$_id.realm" 
          }, 
        count : 
          { 
            $sum : 1        // count number of records for given realm
          } 
      } 
  }
  ],
    function(err, items) {
      if(err == null)
        save_to_db(database, transform_provided(items, min_date));
      else
        console.log(err);
  });
}
// --------------------------------------------------------------------------------------
// save data to database
// --------------------------------------------------------------------------------------
function save_to_db(database, items)
{
  for(var item in items) {  // any better way to do this ?
    database.roaming.update(items[item], items[item], { upsert : true },
    function(err, result) {
      if(err)
        console.log(err);
    });
  }
}
// --------------------------------------------------------------------------------------
// transform data for saving to database
// --------------------------------------------------------------------------------------
function transform_provided(items, db_date)
{
  var arr = [];
  var dict = {};

  for(var item in items) {
    dict = {};
    dict['inst_name'] = items[item]['_id']['realm'];
    dict['provided_count'] = items[item]['count'];
    dict['timestamp'] = db_date;
    arr.push(dict);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
// transform data for saving to database
// --------------------------------------------------------------------------------------
function transform_used(items, db_date)
{
  var arr = [];
  var dict = {};

  for(var item in items) {
    dict = {};
    dict['inst_name'] = items[item]['_id']['visinst'];
    dict['used_count'] = items[item]['count'];
    dict['timestamp'] = db_date;
    arr.push(dict);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
// get data for organisations most using roaming
// --------------------------------------------------------------------------------------
function get_most_used(database, min_date, max_date)
{
  database.logs.aggregate(
  [ 
  { 
    $match : 
      { 
        timestamp : 
          { 
            $gte : min_date,
            $lt : max_date 
          }, 
        result : "OK",          // match only successful logins
        visinst : 
          { 
            $ne : "UNKNOWN"       // no unknown institutions
          }
      } 
  },  
  { 
    $group :                    // group by pair [visinst, csi] - normalization by mac address
      {
        _id : 
          { 
            visinst : "$visinst", 
            csi : "$csi" 
          } 
      } 
  },
  { 
    $project : 
    { 
      "_id.visinst" : 1              // we want only visinst
    } 
  }, 
  { 
    $group :                   // group by visinst
      { 
        _id : 
          { 
            visinst : "$_id.visinst" 
          }, 
        count : 
          { 
            $sum : 1           // count number of current visinst
          } 
      } 
  }
  ],
    function(err, items) {
      if(err == null)
        save_to_db(database, transform_used(items, min_date));
      else
        console.log(err);
  });
}
// --------------------------------------------------------------------------------------
module.exports = exp;
