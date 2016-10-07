const express = require('express');
const request = require('request');
const router = express.Router();
// --------------------------------------------------------------------------------------
// get invalid records for specific date
// --------------------------------------------------------------------------------------
router.get('/:date', function(req, res, next) {
  if(isNaN(Date.parse(req.params.date))) {  // validate date
    res.status(500).send({ error : "invalid date: " + req.params.date});        // send error status and message
    return;
  }
  
  var date = new Date(req.params.date);  
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);  // set to 00:00:00:000
  
  req.db.invalid_records.aggregate([
  {
    $match :
      { 
        timestamp : date
      } 
  },
  { 
    $project :
      {
        _id : 0, 
        records : 1     // get only records
      }
  }
  ], function (err, items) {
    respond(err, items, res)
  });
});
// --------------------------------------------------------------------------------------
// filter invalid records data to gen only one entry per pair [ pn, csi ]
// --------------------------------------------------------------------------------------
//var filter_data = function(data)
function filter_data(data)
{
  var filter = [];   // filtering "rules"
  var ret = [];

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
  var url_base = 'https://etlog.cesnet.cz:8443';
  var url = "/invalid_records/";

  request.get({
    url: url_base + url + req.params.date,
  }, function (error, response, body) {
    if(error)
      console.log(error);
    else {
      if(JSON.parse(body).length == 0) {   // handle empty data
        res.json([]);
      }
      else {    // non empty response
        res.json(filter_data(JSON.parse(body)[0]['records']));      // body contains array which contains dict, the key "records" holds the data
      }
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
