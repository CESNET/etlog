const express = require('express');
const request = require('request');
const router = express.Router();
// --------------------------------------------------------------------------------------
// get invalid records for specific date
// --------------------------------------------------------------------------------------
router.get('/:date', function(req, res, next) {
  if(isNaN(Date.parse(req.params.date))) {  // validate date
    res.status(400).send({ error : "invalid date: " + req.params.date});        // send error status and message
    return;
  }
  
  var date = new Date(req.params.date);  
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);  // set to 00:00:00:000
  
  req.db.invalid_records.find({timestamp : date}, { _id : 0, timestamp : 0 }, function (err, items) {
    if(items.length != 0)       // database returned data
      items = items[0]['records']; // convert [{"records":[ ... ]}] to [ ... ]

    respond(err, items, res)
  });
});
// --------------------------------------------------------------------------------------
// filter invalid records data to gen only one entry per pair [ pn, csi ]
// --------------------------------------------------------------------------------------
function filter_data(data)
{
  var filter = [];   // filtering "rules"
  var ret = [];

// --------------------------------------------------------------------------------------
// filter monitoring mac addresses
// part of address is currently 706f6c69*

  var len = data.length;    // number of records
  var i = 0;    // index

  while(i != len) {            // safe way to iterate all items
    var found = data[i].match(/CSI=(706f6c69|70-6f-6c-69|70:6f:6c:69|706f\.6c69\.)*/i);

    if(found && found.indexOf(undefined) == -1) {
      // match returns ["CSI=", undefined] if no match for address is found !
      // so we use the logic above, to verify that match is really found
      data.splice(i, 1);       // delete line from data
      len = data.length;       // update len
    }
    else {
      i++;      // increase only if no match is found
    }
  }

// --------------------------------------------------------------------------------------
// filtering rules

  for(var item in data) {       // create filtering rules
    var fields = data[item].split("#");
    var csi = fields[4];
    var pn = fields[5];
    var id = csi + "#" + pn;
    
    // item already in array, do not add it again
    if(filter.includes(id))
      continue;

    filter.push(id);     // combined id from csi and pn
  }

// --------------------------------------------------------------------------------------
// filter by pair [ pn, csi ]
// both pn and csi may be empty at the same time - in that case, we want all the records including this pair
// => filtering is exclusion based

  for(var item in filter) {
    var cnt = 0;

    for(var line in data) {
      if(data[line].indexOf(filter[item]) != -1) {  // pair present in line
        if(cnt == 0)    // first occurence
          ret.push(data[line]);     // add to result

        cnt++;
      }
    }
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// get invalid records and perform filtering 
// --------------------------------------------------------------------------------------
router.get('/filtered/:date/', function(req, res, next) {
  var url_base = 'https://etlog.cesnet.cz:8443/api';
  var url = "/invalid_records/";

  request.get({
    url: url_base + url + req.params.date,
  }, function (error, response, body) {
    if(error || (response.status != undefined && response.status != 200)) {
      if(error) {   // handle error
        console.log(error);
        res.end(error);
      }
      else {    // handle status code
        console.log(JSON.parse(body).error);
        res.end(JSON.parse(body).error);
      }
    }
    else {
      res.json(filter_data(JSON.parse(body)));  // send filtered data
    }
  });
});
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err) {
    console.log(err);
    res.send(err);
    return;
  }
  
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
