module.exports = function(database) {
// --------------------------------------------------------------------------------------
  var CronJob = require('cron').CronJob;
  //var mail = require('./mail');
  var failed_logins = require('./cron/failed_logins.js');
  var invalid_records = require('./cron/invalid_records.js');
  var mac_count = require('./cron/mac_count.js');
  var roaming = require('./cron/roaming.js');
  //var stats = require('./cron/stats.js'); // TODO
  var user_to_mac = require('./cron/user_to_mac.js');
  //var request = require('./request'); // TODO
// --------------------------------------------------------------------------------------

  // TODO - invalid data - once a day
  // send mail about invalid data - once a month ? or configurable time ?

  //new CronJob('0 30 02 * * 0', function() {     // run once every week at 02:30:00
  //    
  //    // get invalid data
  //    // 

  //request.get_unique_records();

  //    //mail.send_mail(data);
  //    //failed_logins.process_current_data(database);
  //}, null, false, 'Europe/Prague');

// --------------------------------------------------------------------------------------
  // run once a day
  // should be run at more than Date.getTimezoneOffset(); [javascript method] minutes from midnight
  // to prevent inconsistent data - localtime/UTC conversion issue
// --------------------------------------------------------------------------------------
  new CronJob('0 05 02 * * *', function() {     // run at 02:05:00
      failed_logins.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 10 02 * * *', function() {     // run at 02:10:00
      invalid_records.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 15 02 * * *', function() {     // run at 02:15:00
      mac_count.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 20 02 * * *', function() {     // run at 02:20:00
      roaming.process_current_data(database);
  }, null, true, 'Europe/Prague');

// --------------------------------------------------------------------------------------
  // mac to user mapping is run more often
  new CronJob('0 */15 * * * *', function() {   // every 15 minutes
      user_to_mac.process_current_data(database, 900); // every 15 minutes
  }, null, true, 'Europe/Prague');

// --------------------------------------------------------------------------------------

  // TODO - automatic data retention -> delete older data:
  // logs itself after a year ?
  // invalid data after .. ?
  // 

// --------------------------------------------------------------------------------------
  // set to true if old data should be processed
  // old data is processed only once
  var process_old = false;

  if (process_old) {
    //failed_logins.process_old_data(database);
    invalid_records.process_old_data(database);
    //mac_count.process_old_data(database);
    //roaming.process_old_data(database);
    //user_to_mac.process_old_data(database);
  }

// --------------------------------------------------------------------------------------
}
// --------------------------------------------------------------------------------------
