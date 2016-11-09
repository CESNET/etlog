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
exp.get_failed_logins_monthly = function(realm, limit)
{
  var url = "/failed_logins/";
  var done = false;
  var fail;

  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000
  
  var min = new Date(max);
  min.setDate(max.getDate() - 30);  // 30 days before

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format

  if(realm != "cz") // exception for tld
    query += "&username=/.*@" + realm + "$/";          // limit by domain part uf username => realm

  query += "&ok_count=0";         // limit to only users, which have not successfully authenticated
  query += "&limit=" + limit;     // limit number of records
  query += "&sort=-fail_count";   // sort by fail_count
 
  ok = exp.get_succ_logins_monthly(realm);

  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.error(error);
    fail = JSON.parse(body);
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return failed_to_human_readable(fail, sum_fail_count(exp.get_all_failed_logins_monthly(realm)));
}
// --------------------------------------------------------------------------------------
// convert failed logins structure to human readable text
// parameters:
// data - failed data to transform
// sum - sum of all failed logins
// --------------------------------------------------------------------------------------
function failed_to_human_readable(data, sum)
{
  var ret = "";
  var longest = 0;

  // fancy version
  // =======================

  for(var item in data) {
    if(data[item].username.length > longest)
      longest = data[item].username.length;
  }

  for(var item in data) {
    ret += data[item].username;
    for(var i = data[item].username.length; i < longest; i++)   // insert space padding
      ret+= " ";

    ret += " | fail_count: " + data[item].fail_count + ", ok_count: " + data[item].ok_count + ", ratio : " + data[item].ratio + ", ratio to all : "            + Number(data[item].fail_count / sum).toFixed(4) + "\n";
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

  var url = "/search/";
  var done = false;
  var ret;

  var max = new Date(date);
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setDate(max.getDate() - 1);  // 1 day before

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format
  query += "&realm=" + realm;   // limit by realm
  query += "&result=FAIL";        // only failed logins
  query += "&fields=mac_address";  // limit output to limit size of response - mac address may me used for normalization, may not be empty !

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
  var url = "/search/";
  var done = false;
  var ret;

  var max = new Date(date);
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setDate(max.getDate() - 1);  // 1 day before

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format
  query += "&realm=" + realm;   // limit by realm
  query += "&result=OK";        // only successful logins
  query += "&fields=mac_address";  // limit output to limit size of response - mac address may me used for normalization, may not be empty !

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
  var url = "/search/";
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
  query += "&realm=" + realm;   // limit by realm
  query += "&result=OK";        // only successful logins

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
exp.get_all_failed_logins_monthly = function(realm)
{
  var url = "/failed_logins/";
  var done = false;
  var ret;

  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setDate(max.getDate() - 30);  // 30 days before

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format

  if(realm != "cz") // exception for tld
    query += "&username=/.*@" + realm + "$/";          // limit by domain part uf username => realm

  // TODO ?
  //query += "&ok_count=0";         // limit to only users, which have not successfully authenticated

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
