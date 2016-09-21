module.exports = function(database) {
// --------------------------------------------------------------------------------------
  var CronJob = require('cron').CronJob;
  var failed_logins = require('./cron/failed_logins.js');
  var invalid_records = require('./cron/invalid_records.js');
  var mac_count = require('./cron/mac_count.js');
  var roaming = require('./cron/roaming.js');
  //var stats = require('./cron/stats.js'); // TODO
  var user_to_mac = require('./cron/user_to_mac.js');
// --------------------------------------------------------------------------------------

  // TODO - invalid data - once a day
  // send mail about invalid data - once a month ? or configurable time ?


// --------------------------------------------------------------------------------------
  // run once a day
  // should be run at more than Date.getTimezoneOffset(); [javascript method] minutes from midnight
  // to prevent inconsistent data - localtime/UTC conversion issue
// --------------------------------------------------------------------------------------
  new CronJob('0 05 02 * * *', function() {     // run at 02:05:00
      failed_logins.process_current_data(database);
  }, null, false, 'Europe/Prague');

  new CronJob('0 10 02 * * *', function() {     // run at 02:10:00
      invalid_records.process_current_data(database);
  }, null, false, 'Europe/Prague');

  new CronJob('0 15 02 * * *', function() {     // run at 02:15:00
      mac_count.process_current_data(database);
  }, null, false, 'Europe/Prague');

  new CronJob('0 20 02 * * *', function() {     // run at 02:20:00
      roaming.process_current_data(database);
  }, null, false, 'Europe/Prague');

// --------------------------------------------------------------------------------------
  // mac to user mapping is run more often
  new CronJob('0 */15 * * * *', function() {   // every 15 minutes
      user_to_mac.process_current_data(database, 900); // every 15 minutes
  }, null, false, 'Europe/Prague');

// --------------------------------------------------------------------------------------

  // TODO - automatic data retention -> delete older data:
  // logs itself after a year ?
  // invalid data after .. ?
  // 

  // TODO
  //failed_logins.process_old_data(database);
  //invalid_records.process_old_data(database);
  //mac_count.process_old_data(database);
  //roaming.process_old_data(database);
  //user_to_mac.process_old_data(database);
}
// --------------------------------------------------------------------------------------
