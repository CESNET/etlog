// --------------------------------------------------------------------------------------
const request = require('../request');
const async = require('async');
const deasync = require('deasync');
const mail = require('../mail.js');
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process current data
// delete logs which are older than 1 year
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var curr = new Date();
  curr.setHours(0);
  curr.setMinutes(0);
  curr.setSeconds(0);
  curr.setMilliseconds(0);
  var min = new Date(curr);
  min.setTime(prev_min.getTime() - 365 * 86400000);     // 1 year ago
  
  database.logs.remove({ timestamp : { $lt : min }});
};
// --------------------------------------------------------------------------------------
module.exports = exp;

