// --------------------------------------------------------------------------------------
const request = require('../request');
const async = require('async');
const deasync = require('deasync');
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process current data
// check connection stats and notify administrators
// about possible problems
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


    //realms = [ 'flu.cas.cz', 'ssakhk.cz', 'ueb.cas.cz', 'mvso.cz', 'arup.cas.cz', 'uochb.cas.cz' ];
    realms = [ 'flu.cas.cz' ];
    compare_stats(database, realms);
  });

};
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
function compare_stats(database, realms)
{
  var data = get_data(realms);
  console.log(data);
  //compare_data(data);






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
      console.log(keys[key]);
      console.log(data[keys[key]]);

    if(data[keys[key]].avg_ratio_current_to_old.fail > 1.8) {
      //console.log(keys[key]);
      //console.log(data[keys[key]]);
    }
  }
}
// --------------------------------------------------------------------------------------
// compute standard deviation
// parameters:
// avg  = average value for data set
// data = data set
// --------------------------------------------------------------------------------------
function compute_sd(avg, data)
{
  var res = 0;
  for(var item in data) {
    // First, calculate the deviations of each data point from the mean, and square the result of each
    res += Math.pow(data[item] - avg, 2);
  }

  return Math.sqrt(res / data.length);
}
// --------------------------------------------------------------------------------------
// get data for all realms
//
// one realm could produce for example:
//  { 'ibt.cas.cz':
//  { current_stats: { fail: [ 0, 0, 0, 3 ], ok: [ 242, 198, 312, 277 ] },
//    current_avg_stats: { ok: 257.25, fail: 0.75 },
//    current_day_stats: { ok: [ 277 ], fail: [ 3 ] },
//    old_stats: { fail: [ 0, 4, 0, 0 ], ok: [ 312, 103, 242, 198 ] },
//    old_avg_stats: { ok: 213.75, fail: 1 },
//    avg_ratio_current_to_old: { ok: 1.2035087719298245, fail: 0.75 },
//    old_ok_fail_ratio: [ 0.038834951456310676, 0, 0, 0 ],
//    current_ok_fail_ratio: [ 0.010830324909747292 ],
//    old_fail_sd: 1.7320508075688772,
//    current_fail_sd: 1.299038105676658 } }
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
    ret[realms[key]].current_stats = compute_month_stats(realms[key], prev_min);        // stats for past month including previous day
    ret[realms[key]].current_avg_stats = compute_avg(ret[realms[key]].current_stats);   // average
    ret[realms[key]].current_day_stats = get_day_stats(prev_min, realms[key]);          // stats for previous day only
    prev_min.setDate(prev_min.getDate() - 7);                                         // 8 days before current day
    ret[realms[key]].old_stats = compute_month_stats(realms[key], prev_min);          // stats or past month excluding previous day
    ret[realms[key]].old_avg_stats = compute_avg(ret[realms[key]].old_stats);         // average
    ret[realms[key]].avg_ratio_current_to_old = get_avg_ratio(ret[realms[key]].current_avg_stats, ret[realms[key]].old_avg_stats);
    ret[realms[key]].old_ok_fail_ratio = get_ok_fail_ratio(ret[realms[key]].old_stats);
    ret[realms[key]].current_ok_fail_ratio = get_ok_fail_ratio(ret[realms[key]].current_day_stats);
    ret[realms[key]].old_fail_sd = compute_sd(ret[realms[key]].old_avg_stats.fail, ret[realms[key]].old_stats.fail); // compute SD for old data
    ret[realms[key]].current_fail_sd = compute_sd(ret[realms[key]].current_avg_stats.fail, ret[realms[key]].current_stats.fail); // compute SD for current data
    callback(null);
  }, function (err) {
    if (err)
      console.error(err);
    done = true;  
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// get both ok and fail stats for past month from given gate for given realm
// --------------------------------------------------------------------------------------
function compute_month_stats(realm, prev_min)
{
  var month = [0, 7, 14, 21];      // month by weeks
  var month_day = new Date(prev_min);
  var res = {};
  res.fail = [];
  res.ok = [];
  var done = false;

  async.forEachOf(month, function (value, key, callback) {        // loop same days in month
    async.series([
      function(done) {
        month_day = new Date(prev_min.getTime() - (month[key] * 86400000)); // correct time adjusting
        request.get_failed_logins_daily(month_day, realm, done);
      },
      function(done) {
        month_day = new Date(prev_min.getTime() - (month[key] * 86400000)); // correct time adjusting
        res.ok.push(request.get_succ_logins_daily(month_day, realm).length);
        done(null);
      },
      ],
      function(err, results) {
        res.fail.push(sum_fail_count(results[0]));
        callback(null);
    });
  }, function (err) {
    if (err)
      console.error(err);
    done = true;  
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return res; // return dict
}
// --------------------------------------------------------------------------------------
// compute ratio of fail to ok count for each item
// --------------------------------------------------------------------------------------
function get_ok_fail_ratio(data)
{
  var ret = [];

  for(var i = 0; i < data.fail.length; i++) {  // same as ok
    if(data.ok[i] == 0)             // sth / 0
      ret.push(data.fail[i]);

    else if(data.fail[i] == 0 && data.ok[i] != 0)   // 0 / sth
      ret.push(0);

    else
      ret.push(data.fail[i] / data.ok[i]);
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// compute ratio of both ok and fail average values
// --------------------------------------------------------------------------------------
function get_avg_ratio(curr, old)
{
  var items = ['ok', 'fail'];
  var res = {};

  for(var i in items) {
    if(old[items[i]] == 0) {
      if(curr[items[i]] != 0)
        res[items[i]] = curr[items[i]];
      else
        res[items[i]] = 0;
    }
    else
      res[items[i]] = curr[items[i]] / old[items[i]];
  }

  return res;
}
// --------------------------------------------------------------------------------------
// get both ok and fail stats for given day and realm
// --------------------------------------------------------------------------------------
function get_day_stats(date, realm)
{
  var done = false;
  var res = {};

  async.series([
    function(done) {
      request.get_failed_logins_daily(date, realm, done);
    },
    function(done) {
      res.ok = [ request.get_succ_logins_daily(date, realm).length ];
      done(null);
    },
    ],
    function(err, results) {
      res.fail = [ sum_fail_count(results[0]) ];
      done = true;
  });
 
  deasync.loopWhile(function() {
    return !done;
  });

  return res;
}
// --------------------------------------------------------------------------------------
// compute sum of fail count for given data
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
// compute average value for both ok and fail values
// --------------------------------------------------------------------------------------
function compute_avg(data)
{
  var cnt = data.fail.length;   // same as ok
  var sum = 0;
  var ret = {};
  ret.ok = 0;
  ret.fail = 0;

  for(var item in data.ok) {
    ret.ok += data.ok[item];
  }

  for(var item in data.fail) {
    ret.fail += data.fail[item];
  }

  ret.ok = ret.ok / cnt;
  ret.fail = ret.fail / cnt;

  return ret;
}
// --------------------------------------------------------------------------------------
module.exports = exp;

