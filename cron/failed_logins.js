const async = require( 'async' );
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// perform failed logins counting
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
        console.log("cron task failed_logins finished processing old data");
      callback(null, null);
    });
  });
};
// --------------------------------------------------------------------------------------
// perform failed logins counting
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
          } 
      } 
  }, 
  { 
    $project : 
      { 
        timestamp : 1, pn : 1, result : 1   // limit to timestamp, pn and result
      } 
  },  
  { 
    $group :                                // group by pair [ pn, result ]
    { 
      _id : 
      { 
        pn : "$pn", result : "$result" 
      }, 
      count :                               // count number of occurences
      { 
        $sum : 1 
      } 
    } 
  }, 
  { 
    $group :                                // group again by username
    { 
      _id : 
        { 
          pn : "$_id.pn" 
        }, 
      results :                             // add result to array
        { 
          $addToSet : "$$ROOT._id.result" 
        }, 
      result_count :                        // add count of results to array
        { 
          $addToSet : "$count" 
        }, 
    } 
  }, 
  { 
    $match :                                // exclude users with only OK results
    { 
      results : 
        { 
          $in : [ "FAIL" ] 
        } 
    }  
  }
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
    database.failed_logins.update(items[item], items[item], { upsert : true },
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
    database.failed_logins.update(items[key], items[key], { upsert : true },
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
// transform item structure
// input : 
// { _id: { pn: 'skgtns1@ucl.ac.uk' }, results: [ 'OK', 'FAIL' ], result_count: [ 2, 1 ] }
// output:
// { username: 'skgtns1@ucl.ac.uk', OK: 2, FAIL: 1, ratio: 0.3333333333333333, timestamp: 2016-09-12T22:00:00.000Z }
// --------------------------------------------------------------------------------------
function transform(items, db_date) {
  var arr = [];
  var dict = {};

  for(var item in items) {
    dict = {};              // needed for deep copy
    dict['username'] = items[item]['_id']['pn'];

    if(items[item]['results'].length != items[item]['result_count'].length) {   // both numbers for ok and fail are the same [ result_count.lenght == 1 ]
        dict['ok_count'] = items[item]['result_count'][0];
        dict['fail_count'] = items[item]['result_count'][0];
    }
    else {  // both numbers are different
      //for(var i = 0; i < items[item]['results'].length; i++)
      //  dict[items[item]['results'][i]] = items[item]['result_count'][i]; 
      // this code can be used, but dict keys "OK" and "FAIL" have to be transladed
      // also "OK" may not be present at all, so it must be filled manually

      // another problem here is that order of values in Array results (results: [ 'OK', 'FAIL' ]) is undefined
      // order of values in result_count corresponds to order of results
      if(items[item]['results'][0] == "OK") {   //  results: [ 'OK', 'FAIL' ]
        dict['ok_count'] = items[item]['result_count'][0];
        dict['fail_count'] = items[item]['result_count'][1];
      }
      else {   //  results: [ 'FAIL', 'OK' ]
        // "OK" may be undefined !

        dict['fail_count'] = items[item]['result_count'][0];
        dict['ok_count'] = items[item]['result_count'][1] || 0; // if "OK" is undefined, count is 0
      }
    }

    dict['ratio'] =  (dict['fail_count'] / (dict['fail_count'] + dict['ok_count']));
    dict['timestamp'] = db_date;
    arr.push(dict);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
module.exports = exp;

