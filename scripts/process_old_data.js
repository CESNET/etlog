#!/usr/bin/env node

// --------------------------------------------------------------------------------------
const database = require( '../db' );
const async = require( 'async' );
const failed_logins = require('../cron/failed_logins.js');
const invalid_records = require('../cron/invalid_records.js');
const mac_count = require('../cron/mac_count.js');
const roaming = require('../cron/roaming.js');
const users_mac = require('../cron/users_mac.js');
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
    failed_logins.process_old_data(database, callback);
  },
  function(callback) {
    invalid_records.process_old_data(database, callback);
  },
  function(callback) {
    mac_count.process_old_data(database, callback);
  },
  function(callback) {
    roaming.process_old_data(database, callback);
  },
  function(callback) {
    users_mac.process_old_data(database, callback);
  }
  ],
  function(err, results) {
    console.log("processing of old data is done");
    database.disconnect();
});
// --------------------------------------------------------------------------------------
