module.exports = function(database) {
// --------------------------------------------------------------------------------------
  const CronJob = require('cron').CronJob;
  const mail = require('./mail');
  const failed_logins = require('./cron/failed_logins.js');
  const mac_count = require('./cron/mac_count.js');
  const roaming = require('./cron/roaming.js');
  //const stats = require('./cron/stats.js'); // TODO
  const users_mac = require('./cron/users_mac.js');
  const heat_map = require('./cron/heat_map.js');
  const shared_mac = require('./cron/shared_mac.js');
  const request = require('./request');
  const config = require('./config/config.js');
// --------------------------------------------------------------------------------------
  new CronJob('0 00 06 1 * *', function() {     // run once a month
    mail.send_mail_to_realm_admins(database, request.get_failed_logins_monthly, config.failed_logins_lines);
  }, null, true, 'Europe/Prague');
// --------------------------------------------------------------------------------------
  // run once a day
  // should be run at more than Date.getTimezoneOffset(); [javascript method] minutes from midnight
  // to prevent inconsistent data - localtime/UTC conversion issue
// --------------------------------------------------------------------------------------
  new CronJob('0 05 02 * * *', function() {     // run at 02:05:00
    failed_logins.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 15 02 * * *', function() {     // run at 02:15:00
    mac_count.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 20 02 * * *', function() {     // run at 02:20:00
    roaming.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 25 02 * * *', function() {     // run at 02:25:00
    shared_mac.process_current_data(database);
  }, null, true, 'Europe/Prague');

  new CronJob('0 35 02 * * *', function() {     // run at 02:35:00
    heat_map.process_current_data(database);
  }, null, true, 'Europe/Prague');


// --------------------------------------------------------------------------------------
  // mac to user mapping is run more often
  new CronJob('0 */15 * * * *', function() {   // every 15 minutes
    users_mac.process_current_data(database, 900); // every 15 minutes
  }, null, true, 'Europe/Prague');

// --------------------------------------------------------------------------------------

  // TODO - automatic data retention -> delete older data:
  // logs itself after a year ?
  // invalid data after .. ?
  // 
}
// --------------------------------------------------------------------------------------
