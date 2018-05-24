// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process current data
// delete data from specified colletions which are older than specified number od days
// --------------------------------------------------------------------------------------
exp.delete_old_data = function (database, colletion, days) {
  var curr = new Date();
  curr.setHours(0);
  curr.setMinutes(0);
  curr.setSeconds(0);
  curr.setMilliseconds(0);
  var min = new Date(curr);
  min.setTime(min.getTime() - days * 86400000);     // convert days to milliseconds
  
  database.collection(collection).remove({ timestamp : { $lt : min }});     // delete
};
// --------------------------------------------------------------------------------------
module.exports = exp;

