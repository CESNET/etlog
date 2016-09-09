module.exports = function(database) {
// --------------------------------------------------------------------------------------
  var CronJob = require('cron').CronJob;
  var user_to_mac = require('./cron/user_to_mac.js');
  var invalid_data = require('./cron/invalid_data.js');     // TODO - test
// --------------------------------------------------------------------------------------

  //new CronJob('0 48 * * * *', function() {      // TODO
  //    user_to_mac.process_current_data(database);

  ////}, null, true, 'America/Los_Angeles');
  //}, null, true, 'Etc/UTC');                    // TODO


  // TODO - invalid data - once a day

  // send mail about invalid data - once a month ? or configurable time ?



  // debug
  //invalid_data.process_records(database)


  // TODO - automatic data retention -> delete older data:
  // logs itself after a year ?
  // invalid data after .. ?
  // 

}
// --------------------------------------------------------------------------------------
