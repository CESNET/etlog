#!/usr/bin/env node

// --------------------------------------------------------------------------------------
const failed_logins = require('../cron/failed_logins.js');
const invalid_records = require('../cron/invalid_records.js');
const mac_count = require('../cron/mac_count.js');
const roaming = require('../cron/roaming.js');
const user_to_mac = require('../cron/user_to_mac.js');
// --------------------------------------------------------------------------------------
failed_logins.process_old_data(database);
invalid_records.process_old_data(database);
mac_count.process_old_data(database);
roaming.process_old_data(database);
user_to_mac.process_old_data(database);
// --------------------------------------------------------------------------------------
