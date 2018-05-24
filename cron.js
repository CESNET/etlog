module.exports = function(database) {
// --------------------------------------------------------------------------------------
  const CronJob = require('cron').CronJob;
  const mail = require('./mail');
  const failed_logins = require('./cron/failed_logins.js');
  const mac_count = require('./cron/mac_count.js');
  const roaming = require('./cron/roaming.js');
  const concurrent_users = require('./cron/concurrent_users.js');
  const users_mac = require('./cron/users_mac.js');
  const heat_map = require('./cron/heat_map.js');
  const shared_mac = require('./cron/shared_mac.js');
  const realm_logins = require('./cron/realm_logins.js');
  const visinst_logins = require('./cron/visinst_logins.js');
  const request = require('./request');
  const retention = require('./cron/delete_data.js')
  const unique_users = require('./cron/unique_users.js')
  const config = require('./config/config.js');
  const assert = require('assert');
  const fs = require('fs');
  const async = require('async');
// --------------------------------------------------------------------------------------

  new CronJob('0 59 05 1 * *', function() {     // run once a month
    async.series([
      // disable realm admins synchronization
      function(callback) {
        fs.writeFile(config.etlog_log_root + "/ldap/sync_disabled", "", function(err) {
          if(err) {
            console.error(err);
          }
          callback(null);
        });
      },
      function(callback) {
        mail.send_realm_stats(database, request.get_compromised_users_stats, config.radius_admin, request.get_latest_revision(database), callback);
      },
      function(callback) {
        mail.send_mail_to_realm_admins(database, request.get_compromised_users_monthly, config.compromised_users_subj, request.get_latest_revision(database), callback);
      },
      function(callback) {
        mail.send_mail_to_realm_admins(database, request.get_failed_logins_monthly, config.failed_logins_subj, config.failed_logins_lines, callback);
      },
      // enable realm admins synchronization
      function(callback) {
        fs.unlink(config.etlog_log_root + "/ldap/sync_disabled", function(err) {
          if(err) {
            console.error(err);
          }
          callback(null);
        });
      }
    ]);
  }, null, true, 'Europe/Prague');
// --------------------------------------------------------------------------------------
  // run once a day
  // should be run at more than Date.getTimezoneOffset(); [javascript method] minutes from midnight
  // to prevent inconsistent data - localtime/UTC conversion issue
// --------------------------------------------------------------------------------------
  new CronJob('0 05 02 * * *', function() {     // run at 02:05:00
    failed_logins.process_current_data(database);
    retention.delete_old_data(database, "failed_logins", 365);
  }, null, true, 'Europe/Prague');

  new CronJob('0 15 02 * * *', function() {     // run at 02:15:00
    mac_count.process_current_data(database);
    retention.delete_old_data(database, "mac_count", 365);
  }, null, true, 'Europe/Prague');

  new CronJob('0 20 02 * * *', function() {     // run at 02:20:00
    roaming.process_current_data(database);
    // nothing serious to delete here
  }, null, true, 'Europe/Prague');

  new CronJob('0 25 02 * * *', function() {     // run at 02:25:00
    shared_mac.process_current_data(database);
    retention.delete_old_data(database, "shared_mac", 365);
  }, null, true, 'Europe/Prague');

  new CronJob('0 35 02 * * *', function() {     // run at 02:35:00
    realm_logins.process_current_data(database);
    // nothing serious to delete here
  }, null, true, 'Europe/Prague');

  new CronJob('0 40 02 * * *', function() {     // run at 02:40:00
    visinst_logins.process_current_data(database);
    // nothing serious to delete here
  }, null, true, 'Europe/Prague');

  new CronJob('0 45 02 * * *', function() {     // run at 02:45:00
    heat_map.process_current_data(database);
    // nothing serious to delete here
  }, null, true, 'Europe/Prague');

  new CronJob('0 55 02 * * *', function() {     // run at 02:55:00
    unique_users.process_current_data(database);
    retention.delete_old_data(database, "unique_users", 365);
  }, null, true, 'Europe/Prague');

  new CronJob('0 00 03 * * *', function() {     // run at 03:00:00
    retention.delete_old_data(database, "logs", 365);
  }, null, true, 'Europe/Prague');

  new CronJob('0 10 03 * * *', function() {     // run at 03:10:00
    concurrent_users.process_current_data(database);
    retention.delete_old_data(database, "concurrent_users", 365);
  }, null, true, 'Europe/Prague');

// --------------------------------------------------------------------------------------
  // this is not used anywhere in frontend so no need to process this
  //// mac to user mapping is run more often
  //new CronJob('0 */15 * * * *', function() {   // every 15 minutes
  //  users_mac.process_current_data(database, 900); // every 15 minutes
  //}, null, true, 'Europe/Prague');
}
// --------------------------------------------------------------------------------------
