// --------------------------------------------------------------------------------------
const request = require('../request');
const async = require('async');
const deasync = require('deasync');
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database) {
  // TODO
};
// --------------------------------------------------------------------------------------
// TODO
// process data for previous day -> all data for that day are gathered
// 
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var realms = [];
  database.realms.aggregate([ 
  { $project : { _id : 0, realm : 1 } }
  ],
  function(err, items) {
    for(var item in items)
      realms.push(items[item].realm);

    // debug
    //realms = [ 'fit.cvut.cz' ];
    //realms = [ 'fit.cvut.cz', 'cvut.cz', 'cuni.cz' ];
    //realms = [ 'utia.cas.cz', 'uhk.cz' ];
    //realms = [ 'asu.cas.cz' ];


    realms = [ 'flu.cas.cz', 'ssakhk.cz', 'ueb.cas.cz', 'mvso.cz', 'arup.cas.cz', 'uochb.cas.cz' ];
    compare_stats(database, realms);
  });

};
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function compare_stats(database, realms)
{
  var data = get_data(realms);
  //console.log(data);
  compare_data(data);






  //var avg_ratio = current_avg_stats / old_avg_stats;            
  //
  //console.log(current_stats, old_stats);
  //console.log(current_avg_stats, old_avg_stats);
  //console.log(current_avg_stats / old_avg_stats);

  //// TODO - compage avg
  //// TODO - compare individual numbers
  //// 
  //
  //// ============================

  //// use awg for previous week for each day separately
  //// compare with previous day


  //// use avg for previous week without previous day
  //// use avg for previous week with previous day
  //// -> compare failed login counts

  //// did any successfull logins occur?

  //// compare previous day with same day of past week 
  //// how must does the values differ ?
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function compare_data(data)
{
  var keys = Object.keys(data);

  for(var key in keys) {
    // ratio > 1 could signalize some problems
    if(data[keys[key]].avg_ratio > 1.8) {   
      // if close to 2, these possibility is higher
      // do some further checking

      var cnt = 0;
      // check how many of individual values is lower than current value
      for(var item in data[keys[key]].old_stats) {
        if(data[keys[key]].current_stats > data[keys[key]].old_stats[item])
          cnt++
      }
     
      // 3 or 4 values of 4 are lower than current stats 
      if(cnt >= 3) {
        // TODO - check how much the the value differ from highest values
        

        var highest = data[keys[key]].old_stats.sort(function(a, b) { return a - b; });
        console.log(highest);

        // check how much the the value differ from highest values
        if(data[keys[key]].current_stats >= (highest[0] * 2)) {   // at least twice as high as highest value
          
          var curr = new Date();        // current day
          curr.setHours(0);
          curr.setMinutes(0);
          curr.setSeconds(0);
          curr.setMilliseconds(0);
          var prev_min = new Date(curr); 
          prev_min.setDate(prev_min.getDate() - 1);     // previous day hh:mm:ss:ms set to 00:00:00:000
          
          // check count of successfull logins for previous day
          var succ = request.get_succ_logins_daily(prev_min, keys[key]);
          console.log(succ.length);
          if(succ.length == 0) {     // no successful loging exist
            console.log("possible problem");
            console.log(keys[key]);
            console.log(data[keys[key]]);
          }
        }
      }
    }
  }
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_data(realms)
{
  var curr = new Date();        // current day
  curr.setHours(0);
  curr.setMinutes(0);
  curr.setSeconds(0);
  curr.setMilliseconds(0);
  var prev_min = new Date(curr); 
  prev_min.setDate(prev_min.getDate() - 1);     // previous day hh:mm:ss:ms set to 00:00:00:000
  var ref = new Date(prev_min);
  var ret = {};
  var done = false;

  async.forEachOf(realms, function (value, key, callback) {                    // loop all realms
    prev_min = new Date(ref);
    ret[realms[key]] = {};
    var current_stats = compute_month_stats(realms[key], prev_min);             // stats for past month including previous day
    ret[realms[key]].current_avg_stats = compute_avg(current_stats);            // average
    ret[realms[key]].current_stats = get_day_stats(prev_min, realms[key]);      // stats for previous day only
    prev_min.setDate(prev_min.getDate() - 7);                                   // 8 days before current day
    ret[realms[key]].old_stats = compute_month_stats(realms[key], prev_min);    // stats or past month excluding previous day
    ret[realms[key]].old_avg_stats = compute_avg(ret[realms[key]].old_stats);   // average
    ret[realms[key]].avg_ratio = get_avg_ratio(ret[realms[key]].current_avg_stats, ret[realms[key]].old_avg_stats);
    callback(null);
  }, function (err) {
    if (err)
      console.log(err);
    done = true;  
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function compute_month_stats(realm, prev_min)
{
  var month = [0, 7, 14, 21];      // month by weeks
  var month_day = new Date(prev_min);
  var res = [];
  var done = false;

  async.forEachOf(month, function (value, key, callback) {        // loop same days in month
    async.series([
      function(done) {
        month_day = new Date(prev_min.getTime() - (month[key] * 86400000)); // correct time adjusting
        request.get_failed_logins_daily(month_day, realm, done);
      },
      ],
      function(err, results) {
        res.push(sum_fail_count(results[0]));
        
        // debug
        //console.log(new Date(prev_min.getTime() - month[key] * 86400000));
        //console.log(sum_fail_count(results[0]));
        callback(null);
    });
  }, function (err) {
    if (err)
      console.log(err);
    done = true;  
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return res; // return array














  //async.forEachOf(realms, function (value_realm, key_realm, callback_realm) {     // loop all realms
  //  async.forEachOf(month, function (value_month, key_month, callback_month) {        // loop same days in month
  //    async.series([
  //      function(done) {
  //        month_day.setDate(prev_min.getDate() - month[key_month]);
  //        request.get_failed_logins_daily(month_day, realms[key_realm], done);
  //      },
  //      ],
  //      function(err, results) {
  //        res.push(sum_fail_count(results[0]));
  //        
  //        // debug
  //        //console.log(new Date(prev_min.getTime() - month[key_month] * 86400000));
  //        //console.log(sum_fail_count(results[0]));
  //        callback_month(null);
  //    });
  //  
  //  }, function (err) {
  //    if (err)
  //      console.log(err);
  //    callback_realm(null);
  //  });
  //
  //}, function (err) {
  //  if (err)
  //    console.log(err);
  //  done = true;  
  //});

  //deasync.loopWhile(function() {
  //  return !done;
  //});

  //return res; // return array
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_avg_ratio(curr, old)
{
  if(old == 0) {
    if(curr != 0)
      return curr;
    else {
      return 0;
    }
  }

  return curr / old;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function get_day_stats(date, realm)
{
  var done = false;
  var res;

  async.series([
    function(done) {
      request.get_failed_logins_daily(date, realm, done);
    },
    ],
    function(err, results) {
      res = sum_fail_count(results[0]);
      done = true;
  });
  
  deasync.loopWhile(function() {
    return !done;
  });

  return res;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function sum_fail_count(data)
{
  var cnt = 0;

  for(var item in data) {
    cnt += data[item].fail_count;
  }

  return cnt;
}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function compute_avg(data)
{
  var cnt = data.length;
  var sum = 0;

  for(var item in data) {
    sum += data[item];
  }

  return (sum / cnt);
}
module.exports = exp;

