// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// perform mac address counting
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database) {
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

    while(min <= current) {
      search(database, min, max);
      min += 86400000;  // continue
      max += 86400000;  // continue
    }
    console.log("cron task mac_count finished processing old data");
  });
};
// --------------------------------------------------------------------------------------
// perform mac address counting
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var curr = new Date();        // current day
  var prev_min = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate() - 1, 0, 0, 0, 0); // previous day hh:mm:ss:ms set to 00:00:00:000
  var prev_max = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate(), 0, 0, 0, 0);     // current day hh:mm:ss:ms set to 00:00:00:000
                                                                                                   // search uses lower than max condition !
  search(database, prev_min, prev_max);
};
// --------------------------------------------------------------------------------------
// perform database search
// --------------------------------------------------------------------------------------
function search(database, min, max) {
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
        csi : 
          { 
            $ne : ""        // no empty mac addresses
          }, 
        result : "OK"       // only successfully authenticated
      } 
  }, 
  { 
    $project :              // take only pn, csi, timestamp
      {
         pn : 1, 
         csi : 1, 
         timestamp : 1 
      } 
  }, 
  { 
    $group :                // group by pair [pn, csi]
      { 
        _id : 
          { 
            pn : "$pn", 
            csi : "$csi" 
          }
      } 
  }, 
  { 
    $group : 
      { 
        _id :  
          { 
            username : "$_id.pn"        // group again by username
          }, 
        count : 
          { 
            $sum : 1                    // count number of records
          }, 
        addrs : 
          { 
              $addToSet : "$_id.csi"    // add mac addresses to array
          }
      } 
  }, 
  { 
    $match : 
      { 
        count : 
          { 
            $gt : 2                     // anyone with more than 2 mac addresses
          } 
      } 
  }
  ],
    function(err, items) {
      if(err == null) {
        save_to_db(database, transform(items, min));    // add timestamp in transform
    }
      else
        console.log(err);
  });
}
// --------------------------------------------------------------------------------------
// save data to dabase
// --------------------------------------------------------------------------------------
function save_to_db(database, items) {
  //database.mac_count.collection.insert(items);      // why the hell this strange syntax ?!  TODO
  // problem with duplicates 

  for(var item in items) {  // any better way to do this ?
    database.mac_count.update(items[item], items[item], { upsert : true },
    function(err, result) {
      console.log(err);
    });
  }
}
// --------------------------------------------------------------------------------------
// transform item structure
// input : 
// { "_id" : { "username" : "11542566@cuni.cz" }, "count" : 1, "addrs" : [ "90fd6159fe27" ], "timestamp" : [ [ ISODate("2015-04-23T14:32:21Z") ] ] }
// output:
// { username: '11542566@cuni.cz', count: 1, addrs: [ '90fd6159fe27' ], timestamp: 2015-04-23T14:32:21.000Z }
// --------------------------------------------------------------------------------------
function transform(items, db_date) {
  var arr = [];
  var dict = {};

  for(var item in items) {
    dict = {};              // needed for deep copy
    dict['username'] = items[item]['_id']['username'];
    dict['count'] = items[item]['count'];
    dict['addrs'] = items[item]['addrs'];
    dict['timestamp'] = db_date;
    arr.push(dict);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
module.exports = exp;

