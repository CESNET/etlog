var mongoose = require('mongoose');
exports.mongoose = mongoose;

var log_schema = mongoose.Schema({
  timestamp : Date,
  realm : String,
  viscountry : String,
  visinst : String,
  csi : String,
  pn : String,
  result : String
});
exports.log_schema = log_schema;

mongoose.connect('mongodb://localhost/fticks');
var record = mongoose.model('logy', log_schema, 'logy');
exports.record = record;

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function (callback) {
  console.log("sucesfully connected do mongodb database on localhost");
});



