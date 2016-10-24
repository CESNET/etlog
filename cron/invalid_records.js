const async = require( 'async' );
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// get invalid records for old data
// and save them to database
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database, callback) {
  var log_root = "/home/etlog/logs/fticks/";
  var etlog_log_root = "/home/etlog/logs/";

  // find the lowest date in database and go from that date to present
  var ref_date;
  var current = new Date();
  var curr_min = new Date(current.getFullYear(), current.getMonth(), current.getUTCDate(), 0, 0, 0, 0);   // current day hh:mm:ss:ms set to 00:00:00:000

  // find all, sort by timestamp, display only timestamp, display one document only
  database.logs.find({ query : {}, $orderby : { timestamp : 1 } } , { timestamp : 1, _id : 0 }, { limit : 1 },
  function(err, doc) {
    var ref_date = doc;

    ref_date = String(ref_date[0]["timestamp"]);    // get only string representation of date

    var fields = ref_date.split(" ");
    var months = {      // months dict for date constructor
      "Jan" : 0,
      "Feb" : 1,
      "Mar" : 2,
      "Apr" : 3,
      "May" : 4,
      "Jun" : 5,
      "Jul" : 6,
      "Aug" : 7,
      "Sep" : 8,
      "Oct" : 9,
      "Nov" : 10,
      "Dec" : 11
    }

    // ------------------------------------
    var min = new Date(fields[3], months[fields[1]], fields[2], 0, 0, 0, 0);        // hh:mm:ss:ms set to 0
    var max = new Date(fields[3], months[fields[1]], Number(fields[2]) + 1, 0, 0, 0, 0);    // next day, hh:mm:ss:ms set to 0
                                                                                    // hours must be set to compensate UTC offset
                                                                                    // search uses lower than max condition !
    // this date handling should guarantee correct interval for all processed records

    async.whilst(function () {
      return min < curr_min;
    },
    function(next) {
      async.series([
        function(done) {
          // use max for UTC correction
          // using min could result in a bad day because of midnight and utc offset !
          // use min to determine month - max could be in another month already
          date = "-" + max.getFullYear() + "-" + zero_pad((Number(min.getMonth()) + 1), 2) + "-" + zero_pad(max.getUTCDate(), 2);

          log_file = log_root + "fticks" + date;      // original file, which contains invalid records
          err_file = etlog_log_root + "transform/err" + date; // /home/etlog/logs/transform/err-2015-01-25

          get_record_numbers(err_file, log_file, database, min, done);
        },
        function(done) {
          min = new Date(min);  // do not use reference here !!
          min.setDate(min.getDate() + 1);  // continue
          max.setDate(max.getDate() + 1);  // continue
          done(null);                      // done
        }
        ],
        function(err, results) {
          next();   // next whilst iteration
      });
    },
    function(err) {
      if(err)
        console.log(err);
      else
        console.log("cron task invalid_records finished processing old data");
      callback(null, null);
    });
  });
};
// --------------------------------------------------------------------------------------
// run once a day
// --------------------------------------------------------------------------------------
// get invalid records for previous day
// and save them to database
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var log_root = "/home/etlog/logs/fticks/";
  var etlog_log_root = "/home/etlog/logs/";
  
  var curr = new Date();        // current day
  var prev_min = new Date(curr.getFullYear(), curr.getMonth(), curr.getUTCDate() - 1, 0, 0, 0, 0);       // previous day hh:mm:ss:ms set to 00:00:00:000
  // this date handling should guarantee correct interval for all processed records

  var date = "-" + prev_min.getFullYear() + "-" + zero_pad((Number(prev_min.getMonth()) + 1), 2) + "-" + zero_pad(prev_min.getDate(), 2);
  // getDate to compensate for UTC offset !!

  var log_file = log_root + "fticks" + date;      // original file, which contains invalid records
  var err_file = etlog_log_root + "transform/err" + date; // /home/etlog/logs/transform/err-2015-01-25

  get_record_numbers(err_file, log_file, read_lines, save_to_db, database, prev_min);
};
// --------------------------------------------------------------------------------------
// get invalid record line numbers and call next processing function
// --------------------------------------------------------------------------------------
function get_record_numbers(err_file, log_file, database, db_date, done)
{
  var arr = [];
  var fs = require('fs');
  var process = require('process');

  try {
    fs.accessSync(err_file, fs.F_OK);
  }
  catch(e) {
    console.log("error log file " + err_file + " does not exist");  // most likely
    return;
  }

  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(err_file) // read file
  });

  lineReader.on('line', function (line) {       // read by lines
    arr.push(line.split(':')[1]);   // add line number of invalid record to array
  });
  
  lineReader.on('close', function() {   // when done
    read_lines(log_file, arr, database, db_date, done);
  });
}
// --------------------------------------------------------------------------------------
// save invalid records to database as array
// --------------------------------------------------------------------------------------
function save_to_db(database, arr, db_date, done)
{
  database.invalid_records.update({ timestamp : db_date }, { timestamp : db_date, records : arr }, { upsert : true },
  function(err, result) {
    if(err)
      console.log(err);
    done(null, null);   // record is saved
  });
}
// --------------------------------------------------------------------------------------
// read invalid lines from original file
// --------------------------------------------------------------------------------------
function read_lines(log_file, numbers, database, db_date, done)
{
  var arr = [];
  var fs = require('fs');
  var process = require('process');
  var readline = require('readline');

  try {
    fs.accessSync(log_file, fs.F_OK);
  }
  catch(e) {
    console.log("log file " + log_file + " does not exist");  // most likely
    return;
  }

  var lineReader = readline.createInterface({
    input: fs.createReadStream(log_file)
  });

  var idx = 0;  // index in numbers array
  var invalid_line = numbers[idx];      // first invalid line
  var line_num = 1; // line number in file

  lineReader.on('line', function (line) {   // read file line by line
    if(line_num++ == invalid_line) {
      arr.push(line);
      idx++;
      invalid_line = numbers[idx];
    }
  });

  lineReader.on('close', function() {   // when done
    save_to_db(database, arr, db_date, done);            // save when done
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

