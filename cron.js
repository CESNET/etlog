module.exports = function(database) {
// --------------------------------------------------------------------------------------
  var CronJob = require('cron').CronJob;
  var user_to_mac = require('./cron/user_to_mac.js');
  var invalid_records = require('./cron/invalid_records.js');     // TODO - test
// --------------------------------------------------------------------------------------

  //new CronJob('0 50 * * * *', function() {      // TODO
  //    user_to_mac.process_current_data(database, 1800);

  ////}, null, true, 'America/Los_Angeles');
  //}, null, true, 'Etc/UTC');                    // TODO


  // TODO - invalid data - once a day

  // send mail about invalid data - once a month ? or configurable time ?



  // debug
  //invalid_data.process_records(database)


  //user_to_mac.process_old_data(database);

  // TODO - automatic data retention -> delete older data:
  // logs itself after a year ?
  // invalid data after .. ?
  // 

}
// --------------------------------------------------------------------------------------
