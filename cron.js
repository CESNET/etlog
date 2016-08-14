module.exports = function(database) {
// --------------------------------------------------------------------------------------
  var CronJob = require('cron').CronJob;
  var user_to_mac = require('./cron/user_to_mac.js');
// --------------------------------------------------------------------------------------

  new CronJob('0 48 * * * *', function() {      // TODO
      user_to_mac.process_current_data(database);

  //}, null, true, 'America/Los_Angeles');
  }, null, true, 'Etc/UTC');


}
// --------------------------------------------------------------------------------------
