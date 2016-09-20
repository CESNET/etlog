var mongoose = require('mongoose');
exports.mongoose = mongoose;
// --------------------------------------------------------------------------------------
var logs_schema = mongoose.Schema({
  timestamp : Date,
  realm : String,
  viscountry : String,
  visinst : String,
  csi : String,
  pn : String,
  result : String
});
// --------------------------------------------------------------------------------------
exports.logs_schema = logs_schema;
var logs = mongoose.model('logs', logs_schema, 'logs');
exports.logs = logs;
// --------------------------------------------------------------------------------------
var users_mac_schema = mongoose.Schema({
  username : String,
  addrs : Array
});
// --------------------------------------------------------------------------------------
exports.users_mac_schema = users_mac_schema;
var users_mac = mongoose.model('users_mac', users_mac_schema, 'users_mac');
exports.users_mac = users_mac;
// --------------------------------------------------------------------------------------
var privileged_ips_schema = mongoose.Schema({
  ip : String
});
// --------------------------------------------------------------------------------------
exports.privileged_ips_schema = privileged_ips_schema;
var privileged_ips = mongoose.model('privileged_ips', privileged_ips_schema, 'privileged_ips');
exports.privileged_ips = privileged_ips;
// --------------------------------------------------------------------------------------
var invalid_records_schema = mongoose.Schema({
  timestamp : Date,
  records : Array
});
// --------------------------------------------------------------------------------------
exports.invalid_records_schema = invalid_records_schema;
var invalid_records = mongoose.model('invalid_records', invalid_records_schema, 'invalid_records');
exports.invalid_records = invalid_records;
// --------------------------------------------------------------------------------------
var mac_count_schema = mongoose.Schema({
  username  : String,
  count     : Number,
  addrs     : Array,
  timestamp : Date
});
// --------------------------------------------------------------------------------------
exports.mac_count_schema = mac_count_schema;
var mac_count = mongoose.model('mac_count', mac_count_schema, 'mac_count');
exports.mac_count = mac_count;
// --------------------------------------------------------------------------------------
var roaming_schema = mongoose.Schema({
  inst_name      : String,
  used_count     : Number,
  provided_count : Number,
  timestmap      : Date
});
// --------------------------------------------------------------------------------------
exports.roaming_schema = roaming_schema;
var roaming = mongoose.model('roaming', roaming_schema, 'roaming');
exports.roaming = roaming;
// --------------------------------------------------------------------------------------
var failed_logins_schema = mongoose.Schema({
  username    : String,
  timestamp   : Date,
  fail_count  : Number,
  ok_count    : Number,
  ratio       : Number
});
// --------------------------------------------------------------------------------------
exports.failed_logins_schema = failed_logins_schema;
var failed_logins = mongoose.model('failed_logins', failed_logins_schema, 'failed_logins');
exports.failed_logins = failed_logins;
// --------------------------------------------------------------------------------------
mongoose.connect('mongodb://localhost/etlog');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
  console.log("sucesfully connected do mongodb database on localhost");
});
// --------------------------------------------------------------------------------------
