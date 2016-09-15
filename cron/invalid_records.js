// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// run once a day
// --------------------------------------------------------------------------------------
// get invalid records for previous day
// and save them to database
// --------------------------------------------------------------------------------------
exp.process_records = function (database) {
  var curr = new Date();        // current day
  var prev_day = new Date(curr.getTime() - 86400000 - 300000);   // previous day - 5 min to not miss any records due to overhead

  var log_root = "/home/etlog/logs/fticks/";
  var etlog_log_root = "/home/etlog/logs/";
  var date = "-" + prev_day.getFullYear() + "-" + zero_pad((Number(prev_day.getMonth()) + 1), 2) + "-" + zero_pad(prev_day.getUTCDate(), 2);

  var log_file = log_root + "fticks" + date;      // original file, which constains invalid records
  var err_file = etlog_log_root + "err" + date; // /var/log/etlog/fticks_err-2015-01-25

  get_record_numbers(err_file, log_file, read_lines, save_to_db, database, prev_day);
};
// --------------------------------------------------------------------------------------
// get invalid record line numbers and call next processing function
// --------------------------------------------------------------------------------------
function get_record_numbers(err_file, log_file, read_lines, save_to_db, database, prev_day)
{
  var arr = [];
  var fs = require('fs');
  var process = require('process');

  fs.access(err_file, fs.F_OK, function(err) {
    if(err) {
      console.log("error log file " + err_file + " does not exist");
      console.log("cron job invalid_data.js failed");
      process.exit(1);
    }
  });

  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(err_file) // read file
  });

  lineReader.on('line', function (line) {       // read by lines
    arr.push(line.split(':')[1]);   // add line number of invalid record to array
  });
  
  lineReader.on('close', function() {   // when done
    read_lines(log_file, arr, save_to_db, database, prev_day);
  });
}
// --------------------------------------------------------------------------------------
// save invalid records to database as array
// --------------------------------------------------------------------------------------
function save_to_db(database, arr, prev_day)
{
  database.invalid_records.insert({ date : prev_day, records : arr });
}
// --------------------------------------------------------------------------------------
// read invalid lines from original file
// --------------------------------------------------------------------------------------
function read_lines(log_file, numbers, save_to_db, database, prev_day)
{
  arr = [];
  var fs = require('fs');
  var process = require('process');

  fs.access(log_file, fs.F_OK, function(err) {
    if(err) {
      console.log("log file " + log_file + " does not exist");
      console.log("cron job invalid_data.js failed");
      process.exit(1);
    }
  });

  fs.readFile(log_file, function (err, data) {      // read file
    if (err) throw err;

    var lines = data.toString('utf-8').split("\n"); // split by newlines

    for(var number in numbers) {
      arr.push(lines[numbers[number] - 1]);         // indexed from 0
    }

    save_to_db(database, arr, prev_day);            // save when done
  });
}
// --------------------------------------------------------------------------------------
// add zero padding of defined width
// --------------------------------------------------------------------------------------
function zero_pad(n, width, z)
{
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
// --------------------------------------------------------------------------------------
module.exports = exp;

