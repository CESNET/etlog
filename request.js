// --------------------------------------------------------------------------------------
var exp = {}
const request = require('request');
const url_base = 'https://etlog.cesnet.cz:8443/api';
// --------------------------------------------------------------------------------------
// get failed logins
// parameter limit number of results
// --------------------------------------------------------------------------------------
exp.get_failed_logins_monthly = function(realm, recipients, limit, callback)
{
  var test = [];
  var url = "/failed_logins/days";

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
 
  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.log(error);
    else
      callback("měsíční report - neúspěšná přihlášení", recipients, failed_to_human_readable(JSON.parse(body))); // return response to caller
  });
}
// --------------------------------------------------------------------------------------
// convert failed logins structure to human readable text
// --------------------------------------------------------------------------------------
function failed_to_human_readable(data)
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

    ret += " | fail_count: " + data[item].fail_count + ", ok_count: " + data[item].ok_count + ", ratio : " + data[item].ratio + "\n";
  }

  return ret;
}
// --------------------------------------------------------------------------------------
module.exports = exp;
