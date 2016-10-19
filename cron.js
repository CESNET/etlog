module.exports = function(database) {
// --------------------------------------------------------------------------------------
  const CronJob = require('cron').CronJob;
  const mail = require('./mail');
  const failed_logins = require('./cron/failed_logins.js');
  const invalid_records = require('./cron/invalid_records.js');
  const mac_count = require('./cron/mac_count.js');
  const roaming = require('./cron/roaming.js');
  //const stats = require('./cron/stats.js'); // TODO
  const user_to_mac = require('./cron/user_to_mac.js');
  const request = require('./request');
// --------------------------------------------------------------------------------------
  // TODO
  // once a month
  new CronJob('0 00 06 1 * *', function() {     // run once a month
    //request.get_invalid_records_monthly(mail.send_mail);      // TODO
    //request.get_failed_logins_monthly(100, mail.send_mail);   // TODO
  }, null, true, 'Europe/Prague');


  //request.get_invalid_records_monthly(mail.send_mail);
  //request.get_failed_logins_monthly(100, mail.send_mail);



// --------------------------------------------------------------------------------------

  // TODO - invalid data - once a day
  // send mail about invalid data - once a month ? or configurable time ?

  //new CronJob('0 30 02 * * 0', function() {     // run once every week at 02:30:00
  // TODO
  //}, null, true, 'Europe/Prague');

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
    user_to_mac.process_current_data(database, 900); // every 15 minutes  // TODO - old data has to process even data for current day !!
  }, null, true, 'Europe/Prague');

// --------------------------------------------------------------------------------------

  // TODO - automatic data retention -> delete older data:
  // logs itself after a year ?
  // invalid data after .. ?
  // 
}
// --------------------------------------------------------------------------------------
