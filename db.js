const mongoose = require('mongoose');
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
  timestamp      : Date
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
var realm_admins_schema = mongoose.Schema({
  realm       : String,
  admins      : Array
});
// --------------------------------------------------------------------------------------
exports.realm_admins_schema = realm_admins_schema;
var realm_admins = mongoose.model('realm_admins', realm_admins_schema, 'realm_admins');
exports.realm_admins = realm_admins;
// --------------------------------------------------------------------------------------
var shared_mac_schema = mongoose.Schema({
  timestamp   : Date,
  mac_address : String,
  users       : Array,
  count       : Number
});
// --------------------------------------------------------------------------------------
exports.shared_mac_schema = shared_mac_schema;
var shared_mac = mongoose.model('shared_mac', shared_mac_schema, 'shared_mac');
exports.shared_mac = shared_mac;
// --------------------------------------------------------------------------------------
var heat_map_schema = mongoose.Schema({
  timestamp     : Date,
  inst_name     : String,
  institutions  : Array
});
// --------------------------------------------------------------------------------------
exports.heat_map_schema = heat_map_schema;
var heat_map = mongoose.model('heat_map', heat_map_schema, 'heat_map');
exports.heat_map = heat_map;
// --------------------------------------------------------------------------------------
var realms_schema = mongoose.Schema({
  realm     : String
});
// --------------------------------------------------------------------------------------
exports.realms_schema = realms_schema;
var realms = mongoose.model('realms', realms_schema, 'realms');
exports.realms = realms;
// --------------------------------------------------------------------------------------
var succ_logins_schema = mongoose.Schema({
  timestamp     : Date,
  username      : String,
  count         : Number
});
// --------------------------------------------------------------------------------------
exports.succ_logins_schema = succ_logins_schema;
var succ_logins = mongoose.model('succ_logins', succ_logins_schema, 'succ_logins');
exports.succ_logins = succ_logins;
// --------------------------------------------------------------------------------------
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
  console.log("sucesfully connected do mongodb database on localhost");
});
// --------------------------------------------------------------------------------------
// connect to the databse
// --------------------------------------------------------------------------------------
exports.connect = function()
{
  mongoose.connect('mongodb://localhost/etlog');
}
// --------------------------------------------------------------------------------------
// disconnect from the databse
// --------------------------------------------------------------------------------------
exports.disconnect = function()
{
  mongoose.connection.close();
}
// --------------------------------------------------------------------------------------
