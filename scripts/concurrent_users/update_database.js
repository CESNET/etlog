#!/usr/bin/env node

// --------------------------------------------------------------------------------------
const database = require( '../../db' );
const async = require( 'async' );
const concurrent_users = require('../../cron/concurrent_users.js');
// --------------------------------------------------------------------------------------
async.series([
  function(callback) {
    database.connect();
    callback(null, null);
  },
  function(callback) {
    // min and max passed as command line parameters
    concurrent_users.process_old_data(database, new Date(process.argv[2]), new Date(process.argv[3]), callback);
  },
  ],
  function(err, results) {
    console.log("data update is done");
    database.disconnect();
});
// --------------------------------------------------------------------------------------
