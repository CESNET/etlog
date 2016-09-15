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
exports.privileged_ips = privileged_ips;
var privileged_ips = mongoose.model('privileged_ips', privileged_ips_schema, 'privileged_ips');
exports.privileged_ips = privileged_ips;
// --------------------------------------------------------------------------------------
var invalid_records_schema = mongoose.Schema({
  date : String,
  records : Array
});
// --------------------------------------------------------------------------------------
exports.invalid_records = invalid_records;
var invalid_records = mongoose.model('invalid_records', invalid_records_schema, 'invalid_records');
exports.invalid_records = invalid_records;
// --------------------------------------------------------------------------------------
var mac_count_schema = mongoose.Schema({
  username : String,
  count    : Number,
  addrs    : Array,
  date     : Date
});
// --------------------------------------------------------------------------------------
exports.mac_count = mac_count;
var mac_count = mongoose.model('mac_count', mac_count_schema, 'mac_count');
exports.mac_count = mac_count;
// --------------------------------------------------------------------------------------
var roaming_schema = mongoose.Schema({
  inst_name      : String,
  used_count     : Number,
  provided_count : Number,
  date           : Date
});
// --------------------------------------------------------------------------------------
exports.roaming = roaming;
var roaming = mongoose.model('roaming', roaming_schema, 'roaming');
exports.roaming = roaming;
// --------------------------------------------------------------------------------------
mongoose.connect('mongodb://localhost/etlog');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
  console.log("sucesfully connected do mongodb database on localhost");
});
// --------------------------------------------------------------------------------------
