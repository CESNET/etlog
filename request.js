// --------------------------------------------------------------------------------------
var exp = {}
const request = require('request');
const url_base = 'https://etlog.cesnet.cz:8443';
// --------------------------------------------------------------------------------------
// get invalid records 
// --------------------------------------------------------------------------------------
exp.get_invalid_records_monthly = function(callback)
{
  var ret = [];
  var url = "/invalid_records/filtered/";

  var date = new Date();     // current date
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);  // set to 00:00:00:000
  date.setDate(date.getDate() -1);    // decrease by 1 day - data for current date are not available yet

  var interval = 30;
  var cnt = 0;      // number of processed items

  for(var i = 0; i < interval; i++) {
    request.get({           // get data
      url: url_base + url + date.toISOString(),
    }, function (error, response, body) {
      if(error || (response.status != undefined && response.status != 200)) {
        if(error) {   // handle error
          console.log(error);
          return;
        }
        else {    // handle status code
          console.log(JSON.parse(body).error);
          return;
        }
      }
      else {
        if(JSON.parse(body).length != 0) {       // no not add empty response
          ret.push(JSON.parse(body));  // add data
        }
      }
      cnt++;    // increase processed count

      if(cnt == interval) {
        //callback("měsíční report - invalidní záznamy", filter_data(ret).toString());  // return data when all requests are done
        // TODO - mail content is too big
        // debug
        return;
      }
    });

    date.setDate(date.getDate() -1);    // decrease by 1 day
  }
}
// --------------------------------------------------------------------------------------
// filter invalid records data to gen only one entry per pair [ pn, csi ]
// --------------------------------------------------------------------------------------
function filter_data(data)
{
  var filter = [];   // filtering "rules"
  var ret = [];

  for(var arr in data) {       // create filtering rules
    for(var item in data[arr]) {
      var fields = data[arr][item].split("#");
      var csi = fields[4];
      var pn = fields[5];
      var id = csi + "#" + pn;
      
      // item already in array, do not add it again
      if(filter.includes(id))
        continue;

      filter.push(id);     // combined id from csi and pn
    }
  }

// --------------------------------------------------------------------------------------
// filter by pair [ pn, csi ]
// both pn and csi may be empty at the same time - in that case, we want all the records including this pair
// => filtering is exclusion based

  for(var item in filter) {
    var cnt = 0;

    for(var arr in data) {
      for(var line in data[arr]) {
        if(data[arr][line].indexOf(filter[item]) != -1) {  // pair present in line
          if(cnt == 0)    // first occurence
            ret.push(data[arr][line].replace(/[^ -~]+/g, ""));     // add to result, remove non printable characters
          cnt++;
        }
      }
    }
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// get failed logins
// parameter limit number of results
// --------------------------------------------------------------------------------------
exp.get_failed_logins_monthly = function(limit, callback)
{
  var test = [];
  var url = "/failed_logins/";

  var max = new Date();     // current date
  max.setHours(0);
  max.setMinutes(0);
  max.setSeconds(0);
  max.setMilliseconds(0);  // set to 00:00:00:000
  
  var min = new Date(max);
  min.setDate(max.getDate() - 30);  // 30 days before

  var query = '?timestamp>=' + min.toISOString() + "&timestamp<" + max.toISOString();  // use ISO-8601 format
  query += "&limit=" + limit;   // limit number of records
  query += "&sort=-fail_count";   // sort by fail_count
 
  request.get({
    url: url_base + url + query     // use query string here for simple usage
  }, function (error, response, body) {
    if(error)
      console.log(error);
    else
      callback("měsíční report - neúspěšná přihlášení", failed_to_human_readable(JSON.parse(body))); // return response to caller
  });
}
// --------------------------------------------------------------------------------------
// convert failed logins structure to human readable text
// --------------------------------------------------------------------------------------
function failed_to_human_readable(data)
{
  var ret = "";

  for(var item in data)
    ret += data[item].username + "| fail_count: " + data[item].fail_count + ", ok_count: " + data[item].ok_count + ", ratio : " + data[item].ratio + "\n";

  return ret;
}
// --------------------------------------------------------------------------------------
module.exports = exp;
