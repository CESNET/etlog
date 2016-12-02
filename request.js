// --------------------------------------------------------------------------------------
var exp = {}
const request = require('request');
const deasync = require('deasync');
const url_base = 'https://etlog.cesnet.cz:8443/api';
// --------------------------------------------------------------------------------------
// get failed logins
// parameters:
// realm = limit query only to this realm
// limit = limit number of results
//  limit number of results
// --------------------------------------------------------------------------------------
exp.get_failed_logins_monthly = function(database, realm, limit)
{
  var fail = exp.get_all_failed_logins_monthly(database, realm, limit);
  var sum = exp.get_failed_login_count_monthly(database);

  return failed_to_human_readable(fail, sum);
}
// --------------------------------------------------------------------------------------
// return longest username in data
// --------------------------------------------------------------------------------------
function get_longest(data)
{
  var longest = 0;
  for(var item in data) {
    if(data[item].username.length > longest)
      longest = data[item].username.length;
  }
  return longest;
}
// --------------------------------------------------------------------------------------
// convert failed logins structure to human readable text
// parameters:
// data - failed data to transform
// sum  - sum of all failed logins
//
// data[item]:
// { count: 1640,
//   username: '1230024700532434@wlan.mnc024.mcc230.3gppnetwork.org' }
// --------------------------------------------------------------------------------------
function failed_to_human_readable(data, sum)
{
  var ret = "";
  var longest = get_longest(data);  // longest username found
  // data are already sorted - first one contains highest count
  var num_size = data[0].count.toString().length; // longest failed count length

  // iterate all input items
  for(var item in data) {
    ret += data[item].username;     // set username

    for(var i = data[item].username.length; i < longest; i++)   // insert space padding after username
      ret += " ";

    ret += " | neúspěšná přihlášení: " + data[item].count;
    ret += ", ";

    for(var i = data[item].count.toString().length; i < num_size; i++)   // insert space padding after failed count
      ret += " ";

    //ret += "úspěšná přihlášení: " + data[item].ok_count;
    //ret += ", poměr: " + data[item].ratio;
    ret += "celkový poměr: "  + Number(data[item].count / sum).toFixed(4) + "\n";
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// returns failed logins for given date and realm
// --------------------------------------------------------------------------------------
exp.get_failed_logins_daily = function(date, realm)
{
  // this has to be used to enable normalization by mac address
  // if /failed_logins/ api is used
  // some user could generate a lot of failed autentizations which would be counted !

  var url = "/failed_logins/";
  var done = false;
  var ret;

  var d = new Date(date);
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);  // set to 00:00:00:000

  var query = '?timestamp=' + d.toISOString();
  query += "&username=/^.*@" + realm + "/";   // limit by realm

  // possible clean solution other than limiting output to specific fields:
  // https://github.com/Automattic/mongoose/issues/2964
  // http://mongoosejs.com/docs/api.html#aggregate_Aggregate-cursor

  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.error(error);
    else {
      ret = JSON.parse(body);
      done = true;
    }
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// returns successful logins for given date and realm
// --------------------------------------------------------------------------------------
exp.get_succ_logins_daily = function(date, realm)
{
  var url = "/succ_logins/";
  var done = false;
  var ret;

  var d = new Date(date);
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);  // set to 00:00:00:000

  var query = '?timestamp=' + d.toISOString();
  query += "&username=/^.*@" + realm + "/";   // limit by realm

  // possible clean solution other than limiting output to specific fields:
  // https://github.com/Automattic/mongoose/issues/2964
  // http://mongoosejs.com/docs/api.html#aggregate_Aggregate-cursor

  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.error(error);
    else {
      ret = JSON.parse(body);
      done = true;
    }
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// get successful logins for past month for given realm
// --------------------------------------------------------------------------------------
exp.get_succ_logins_monthly = function(realm)
{
  var url = "/succ_logins/";
  var done = false;
  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setDate(max.getDate() - 30);  // 30 days before
  var ret;

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format
  query += "&username=/^.*@" + realm + "$/";   // limit by realm in username

  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.error(error);
    ret = JSON.parse(body);
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// return all failed logins for past month
// parameters
// realm = limit query only to this realm
// --------------------------------------------------------------------------------------
exp.get_all_failed_logins_monthly = function(database, realm, limit)
{
  var done = false;
  var ret;

  // ==========================================

  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setDate(max.getDate() - 30);  // 30 days before

  // ==========================================

  var aggregate_query = [];

  if(realm != "cz") // exception for tld
    aggregate_query.push({ $match : { timestamp : { $gte : min, $lt : max }, result : "FAIL", realm : realm } });  // limit by timestamp, failed logins, realm
  else
    aggregate_query.push({ $match : { timestamp : { $gte : min, $lt : max }, result : "FAIL"} });  // limit by timestamp, failed logins
  

  aggregate_query.push({ $project : { pn : 1 } });                             // project
  aggregate_query.push({ $group : { _id : { pn : "$pn" }, count : { $sum : 1 } } });     // group by [ pn, result ], count
  aggregate_query.push({ $sort : { count : -1 } });   // sort by count
  aggregate_query.push({ $limit : limit });              // limit 
  aggregate_query.push({ $project : { username : "$_id.pn", count : 1, _id : 0 } });      // final projection

  // ==========================================

  database.logs.aggregate(aggregate_query,
  function(err, items) {
    if(err)
      console.error(err);

    ret = items;
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// return sum of failed logins for past month
// --------------------------------------------------------------------------------------
exp.get_failed_login_count_monthly = function(database)
{
  var done = false;
  var ret;

  // ==========================================

  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setDate(max.getDate() - 30);  // 30 days before

  database.logs.count({ timestamp : { $gte : min, $lt : max }, result : "FAIL"},
  function(err, items) {
    if(err)
      console.error(err);

    ret = items;
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
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
module.exports = exp;
