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
// --------------------------------------------------------------------------------------
exp.get_failed_logins_monthly = function(database, realm, limit)
{
  var ret = "";
  var out;

  var fail = exp.get_all_failed_logins_monthly(database, realm, limit);
  var sum = exp.get_failed_login_count_monthly(database);

  if(realm != "cz") {
    ret += "neúspěšná přihlášení pro realm " + realm + "\n\n" ;
    ret += "==============================================================================\n\n";
  }

  out = failed_to_human_readable(fail, sum);
  if(!out)
    return "";

  ret += out;

  ret += "\n\n" ;
  ret += "\t\t Odhlášení příjmu těchto emailů je možné na adrese https://etlog.cesnet.cz\n";

  return ret;
}
// --------------------------------------------------------------------------------------
// return longest param in data
// --------------------------------------------------------------------------------------
function get_longest(data, param)
{
  var longest = 0;
  for(var item in data) {
    if(data[item][param].length > longest)
      longest = data[item][param].length;
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
  if(data.length == 0 || sum == 0)
    return; // no data available

  var ret = "";
  var longest = get_longest(data, "username");  // longest username found
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
  min.setTime(max.getTime() - 30 * 86400000);  // 30 days before
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
  min.setTime(max.getTime() - 30 * 86400000);  // 30 days before

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
  min.setTime(max.getTime() - 30 * 86400000);  // 30 days before

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
function get_latest_revision(database)
{
  var done = false;
  var ret;

  database.concurrent_rev.find({}, { _id : 0, revisions : 1 }, function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    }

    ret = items[0].revisions;
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret[ret.length - 1];    // latest revision
}
// --------------------------------------------------------------------------------------
function get_compromised_users_data(database, realm)
{
  var url = "/concurrent_users/";
  var done = false;
  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setTime(max.getTime() - 30 * 86400000);  // 30 days before
  var ret = {};
  ret["revision"] = get_latest_revision(database);

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format
  query += "&username=/^.*@" + realm + "$/";   // limit by realm in username
  query += "&mac_diff=true";   // different addresses
  query += "&diff_needed_timediff>=300";
  query += "&revision=" + ret["revision"];
  query += "&sort=-diff_needed_timediff";   // sort

  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.error(error);
    ret["data"] = JSON.parse(body);
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// create mail about compromised users for specific realm
// --------------------------------------------------------------------------------------
exp.get_compromised_users_monthly = function(database, realm)
{
  var data = get_compromised_users_data(database, realm);
  var revision = data.revision;
  data = data.data;
  var ret = {};

  if(data.length == 0) {        // no data ivailable
    return;
  }

  var mail_data = compromised_users_html_data(data, revision);

  ret.html = compromised_users_html(mail_data, realm, revision);
  ret.plain = compromised_users_plain(mail_data, realm, revision);
  ret.att = compromised_attachement(data);

  return ret;
}
// --------------------------------------------------------------------------------------
// create html part of compromised users mail
// --------------------------------------------------------------------------------------
function compromised_users_html(data, realm, revision)
{
  var ret = "<html>";
  ret += "<head>";
  ret += "<style>";
  ret += "thead th { border : 1px solid black } tbody td { border : 1px solid black }";
  ret += "</style>";
  ret += "</head>";
  ret += "<h3> Seznam potenciálně kompromitovaných identit pro realm " + realm + "</h3>";
  ret += '<table style="border:2px solid black; text-align: center" cellspacing="0" cellpadding="10">';
  ret += "<thead>";
  ret += "<tr>";

  ret += "<th>Uživatelské jméno</th>";
  ret += "<th>Počet incidentů</th>";
  ret += "<th>Počet různých MAC adres</th>";
  ret += "<th>odkaz na incidenty</th>";

  ret += "</tr>";
  ret += "</thead>";
  ret += '<tbody>';


  for(var item in data) {
    ret += "<tr>";
    ret += "<td>" + data[item].username + "</td>";
    ret += "<td>" + data[item].incident_count + "</td>";
    ret += "<td>" + data[item].mac_count + "</td>";
    ret += "<td><a href='https://etlog.cesnet.cz/#/concurrent_users?username=" + data[item].username + "&revision=" + revision + "'>" + data[item].username + "</a></td>";
    ret += "</tr>";
  }

  ret += "</tbody>";
  ret += "</table>";
  ret += "<p>";
  ret += "Seznam nalezených incidentů je přiložen ve formátu CSV.";
  ret += "</p>";
  ret += "<p>";
  ret += "Odhlášení příjmu těchto emailů je možné na adrese https://etlog.cesnet.cz";
  ret += "</p>";
  ret += "</html>";

  return ret;
}
// --------------------------------------------------------------------------------------
// get data for html part of compromised users mail
// --------------------------------------------------------------------------------------
function compromised_users_html_data(data, revision)
{
  var users = get_unique_users(data);
  var results = [];

  for(var user in users) {
    results.push(get_user_data(users[user], revision));
  }

  results.sort(sort_by_inicidents);
  return results;
}
// --------------------------------------------------------------------------------------
// sort by incident count
// --------------------------------------------------------------------------------------
function sort_by_inicidents(a, b)
{
  return b['incident_count'] - a['incident_count'];
}
// --------------------------------------------------------------------------------------
// get concurrent users data for specific user
// --------------------------------------------------------------------------------------
function get_user_data(user, revision)
{
  var url = "/concurrent_users/";
  var done = false;
  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000

  var min = new Date(max);
  min.setTime(max.getTime() - 30 * 86400000);  // 30 days before
  var data;
  var ret = {};

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format
  query += "&username=" + user;
  query += "&username=" + user;
  query += "&mac_diff=true";   // different addresses
  query += "&diff_needed_timediff>=300";
  query += "&revision=" + revision;

  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.error(error);
    else {
      data = JSON.parse(body);
      done = true;
    }
  });

  deasync.loopWhile(function() {
    return !done;
  });

  ret['incident_count'] = data.length;
  ret['mac_count'] = get_unique_mac(data).length;
  ret['username'] = user;

  return ret;
}
// --------------------------------------------------------------------------------------
// get list of unique mac addresses from data
// --------------------------------------------------------------------------------------
function get_unique_mac(data)
{
  var mac = [];

  for(var item in data) {
    if(mac.indexOf(data[item]['mac_address_1']) == -1)
      mac.push(data[item]['mac_address_1']);
    if(mac.indexOf(data[item]['mac_address_2']) == -1)
      mac.push(data[item]['mac_address_2']);
  }

  return mac;
}
// --------------------------------------------------------------------------------------
// get list of unique users from data
// --------------------------------------------------------------------------------------
function get_unique_users(data)
{
  var users = [];

  for(var item in data) {
    if(users.indexOf(data[item].username) == -1)
      users.push(data[item].username);
  }

  return users;
}
// --------------------------------------------------------------------------------------
// return input converted to hours, minutes and seconds string
// fixed format %h:%m
// both hours and minutes are fixed to 2 digits
// --------------------------------------------------------------------------------------
function hms_string(input)
{
  var hours = Math.floor(input / 3600);
  input = input % 3600;
  if(hours < 10)
    hours = "0" + hours;

  var minutes = Math.floor(input / 60);
  if(minutes < 10)
    minutes = "0" + minutes;
  input = input % 60;

  return hours + ":" + minutes;
}
// --------------------------------------------------------------------------------------
// return input converted to distance represented as string
// --------------------------------------------------------------------------------------
function convert_dist(input)
{
  var ret = "";

  if(input >= 100000) {
    ret += Math.round(input / 1000) + " km";
    return ret;
  }

  if(input >= 10000) {
    ret += (input / 1000).toFixed(1) +  " km";
    return ret;
  }

  if(input >= 1000) {
    ret += (input / 1000).toFixed(2) +  " km";
    return ret;
  }

  ret += input +  " m";

  return ret;
}
// --------------------------------------------------------------------------------------
// create csv header for compromised users attachment
// --------------------------------------------------------------------------------------
function compromised_users_header(longest)
{
  var ret = "";

  var data_len = longest['username'] + 2; // longest + ',' + ' '
  ret += "uživatelské jméno, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  data_len += longest['timestamp_1'] + 2;
  ret += "1. autentizace - čas, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  if(longest['visinst_1'] < "instituce".length + 2) {
    longest['visinst_1'] = "instituce".length;
  }
  data_len += longest['visinst_1'] + 2;
  ret += "instituce, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  data_len += longest['mac_address_1'] + 2;
  ret += "MAC adresa, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  data_len += longest['timestamp_2'] + 2;
  ret += "2. autentizace - čas, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  if(longest['visinst_2'] < "instituce".length + 2) {
    longest['visinst_2'] = "instituce".length;
  }
  data_len += longest['visinst_2'] + 2;
  ret += "instituce, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  data_len += longest['mac_address_2'] + 2;
  ret += "MAC adresa, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  if(longest['dist'] < "vzdálenost".length + 2) {
    longest['dist'] = "vzdálenost".length;
  }
  data_len += longest['dist'] + 2;
  ret += "vzdálenost, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  if(longest['time_needed'] < "čas [hh:mm] - potřebný".length + 2) {
    longest['time_needed'] = "čas [hh:mm] - potřebný".length;
  }
  data_len += longest['time_needed'] + 2;
  ret += "čas [hh:mm] - potřebný, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  if(longest['time_difference'] < "dosažený".length + 2) {
    longest['time_difference'] = "dosažený".length;
  }
  data_len += longest['time_difference'] + 2;
  ret += "dosažený, ";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  if(longest['diff_needed_timediff'] < "rodzdíl".length + 2) {
    longest['diff_needed_timediff'] = "rozdíl".length;
  }
  data_len += longest['diff_needed_timediff'] + 2;
  ret += "rozdíl";

  for(var i = ret.length; i < data_len; i++)
    ret += " ";

  // ==============================================

  ret += "\n";
  return ret;
}
// --------------------------------------------------------------------------------------
// create plain text for compromised users mail
// --------------------------------------------------------------------------------------
function compromised_users_plain(data, realm, revision)
{
  var ret = "Seznam potenciálně kompromitovaných identit pro realm " + realm + "\n\n";

  longest_username = get_longest(data, "username");

  var header = "Uživatelské jméno, ";

  if(longest_username > "Uživatelské jméno".length) {
    for(var i = "Uživatelské jméno".length; i < longest_username; i++)
      header += " ";
  }

  header += "Počet incidentů, ";
  header += "Počet různých MAC adres, ";
  header += "odkaz na incidenty";
  header += "\n";
  var mac_len = "Počet různých MAC adres, ".length;
  var incidents_len = "Počet incidentů, ".length;

  ret += header;

  for(var item in data) {
    ret += data[item].username + ", ";

    for(var i = data[item].username.length; i < longest_username; i++)       // username spacing
      ret += " ";

    ret += data[item].incident_count + ", ";

    for(var i = data[item].incident_count.toString().length; i < incidents_len - 2; i++)        // incident count spacing
      ret += " ";

    ret += data[item].mac_count + ", ";

    for(var i = data[item].mac_count.toString().length; i < mac_len - 2; i++)                   // mac count spacing
      ret += " ";

    ret += "https://etlog.cesnet.cz/#/concurrent_users?username=" + data[item].username + "&revision=" + revision
    ret += "\n"
  }

  ret += "\n\n"
  ret += "Seznam nalezených incidentů je přiložen ve formátu CSV.";
  ret += "\n\n" ;
  ret += "\t\t Odhlášení příjmu těchto emailů je možné na adrese https://etlog.cesnet.cz\n";
  return ret;
}
// --------------------------------------------------------------------------------------
// create csv attachment for mail from compromised users data
// --------------------------------------------------------------------------------------
function compromised_attachement(data)
{
  if(data.length == 0)
    return; // no data available

  var ret = "";
  var longest = {};
  var keys = [ "username", "timestamp_1", "visinst_1", "mac_address_1", "timestamp_2",
               "visinst_2", "mac_address_2", "dist", "time_needed", "time_difference", "diff_needed_timediff" ];

  for(var item in data) {
    data[item].dist = convert_dist(data[item].dist);        // convert dist to human readable form

    // time conversion
    data[item].time_needed = hms_string(data[item].time_needed);
    data[item].time_difference = hms_string(data[item].time_difference);
    data[item].diff_needed_timediff = hms_string(data[item].diff_needed_timediff);
  }

  for(var key in keys) {    // find longest values for all keys
    longest[keys[key]] = get_longest(data, keys[key]);
  }

  ret += compromised_users_header(longest);

  // iterate all input items
  for(var item in data) {
    for(var key in keys) {
      ret += data[item][keys[key]];  // add value of key
      ret += ","

      for(var i = data[item][keys[key]].toString().length; i < longest[keys[key]] + 1; i++)   // insert space padding after value, one space between columns
        ret += " ";
    }
    ret += "\n";
  }

  return ret;
}
// --------------------------------------------------------------------------------------
module.exports = exp;
