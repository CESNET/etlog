// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// TODO
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database) {
  // TODO

};
// --------------------------------------------------------------------------------------
// run once a day
// --------------------------------------------------------------------------------------
// get invalid records for previous day
// and save them to database
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var curr = new Date();        // current day
  var prev_min = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate() - 1, 0, 0, 0, 0);       // previous day hh:mm:ss:ms set to 00:00:00:000
  // this date handling should guarantee correct interval for all processed records

  var log_root = "/home/etlog/logs/fticks/";
  var etlog_log_root = "/home/etlog/logs/";
  var date = "-" + prev_min.getFullYear() + "-" + zero_pad((Number(prev_min.getMonth()) + 1), 2) + "-" + zero_pad(prev_min.getUTCDate(), 2);

  var log_file = log_root + "fticks" + date;      // original file, which constains invalid records
  var err_file = etlog_log_root + "transform/err" + date; // /home/etlog/logs/transform/err-2015-01-25

  get_record_numbers(err_file, log_file, read_lines, save_to_db, database, prev_min);
};
// --------------------------------------------------------------------------------------
// get invalid record line numbers and call next processing function
// --------------------------------------------------------------------------------------
function get_record_numbers(err_file, log_file, read_lines, save_to_db, database, db_date)
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
    read_lines(log_file, arr, save_to_db, database, db_date);
  });
}
// --------------------------------------------------------------------------------------
// save invalid records to database as array
// --------------------------------------------------------------------------------------
function save_to_db(database, arr, db_date)
{
  database.invalid_records.insert({ date : db_date, records : arr });
}
// --------------------------------------------------------------------------------------
// read invalid lines from original file
// --------------------------------------------------------------------------------------
function read_lines(log_file, numbers, save_to_db, database, db_date)
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

    save_to_db(database, arr, db_date);            // save when done
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

