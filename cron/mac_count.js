// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// perform mac address counting
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

    date = new Date(fields[3], months[fields[1]], fields[2]);   // hh:mm:ss set to 0
    var next_date = new Date(date.getTime() + 86400000);        // next day

    while(date < current) {
      search(database, date, next_date);
      date = next_date;                         // continue
      next_date = new Date(date.getTime() + 86400000);  // next day
    }
    console.log("cron task mac_count finished processing old data");
  });
};
// --------------------------------------------------------------------------------------
// perform mac address counting
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var curr = new Date();        // current day
  var prev_day = new Date(curr.getTime() - 86400000);   // previous day 

  // TODO - is there a chance to miss any data here due to overhead?
  // if it is possible, solution may me to manually insert date between min and max in the timestamp field of result

  search(database, prev_day, curr);
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
          }, 
        timestamp : 
          { 
            $addToSet : "$timestamp"    // add timestamp
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
          }, 
        timestamp : 
          { 
            $addToSet : "$timestamp"    // add timestamp
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
  },
  { 
    $project : 
      { 
        username : 1, 
        count : 1, 
        addrs : 1, 
        timestamp : 
          { 
            $slice : [ "$timestamp", 1 ]    // limit number of elements in timestamp to 1
          }
      }
  }
  ],
    function(err, items) {
      if(err == null)
        save_to_db(database, transform(items));
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
    console.log(items[item]);
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
function transform(items) {
  var arr = [];
  var dict = {};

  for(var item in items) {
    dict = {};              // needed for deep copy
    dict['username'] = items[item]['_id']['username'];
    dict['count'] = items[item]['count'];
    dict['addrs'] = items[item]['addrs'];
    dict['timestamp'] = items[item]['timestamp'][0][0];
    arr.push(dict);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
module.exports = exp;

