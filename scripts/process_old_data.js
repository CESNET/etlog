#!/usr/bin/env node

// --------------------------------------------------------------------------------------
const database = require( '../db' );
const async = require( 'async' );
const failed_logins = require('../cron/failed_logins.js');
const mac_count = require('../cron/mac_count.js');
const roaming = require('../cron/roaming.js');
const users_mac = require('../cron/users_mac.js');
const shared_mac = require('../cron/shared_mac.js');
const heat_map = require('../cron/heat_map.js');
const realm_logins = require('../cron/realm_logins.js');
const visinst_logins = require('../cron/visinst_logins.js');
const unique_users = require('../cron/unique_users.js');
const concurrent_users = require('../cron/concurrent_users.js');
// --------------------------------------------------------------------------------------
// launch all tasks in defined order
// every task is launched after previous is finished
async.series([
  function(callback) {
    database.connect();
    callback(null, null);
  },
  function(callback) {
    failed_logins.process_old_data(database, callback);
  },
  function(callback) {
    mac_count.process_old_data(database, callback);
  },
  function(callback) {
    roaming.process_old_data(database, callback);
  },
  function(callback) {
    users_mac.process_old_data(database, callback);
  },
  function(callback) {
    shared_mac.process_old_data(database, callback);
  },
  function(callback) {
    heat_map.process_old_data(database, callback);
  },
  function(callback) {
    realm_logins.process_old_data(database, callback);
  },
  function(callback) {
    visinst_logins.process_old_data(database, callback);
  },
  function(callback) {
    unique_users.process_old_data(database, callback);
  },
  function(callback) {
    concurrent_users.process_old_data(database, callback);
  },
  ],
  function(err, results) {
    console.log("processing of old data is done");
    database.disconnect();
});
// --------------------------------------------------------------------------------------
