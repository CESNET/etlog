#!/usr/bin/env node

// --------------------------------------------------------------------------------------
const database = require( '../db' );
const failed_logins = require('../cron/failed_logins.js');
const invalid_records = require('../cron/invalid_records.js');
const mac_count = require('../cron/mac_count.js');
const roaming = require('../cron/roaming.js');
const users_mac = require('../cron/users_mac.js');
// --------------------------------------------------------------------------------------
failed_logins.process_old_data(database);
invalid_records.process_old_data(database);
mac_count.process_old_data(database);
roaming.process_old_data(database);
users_mac.process_old_data(database);
// --------------------------------------------------------------------------------------
