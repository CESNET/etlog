const async = require( 'async' );
const fs = require('fs');
const data_file = "/home/etlog/etlog/scripts/concurrent_users/inst.json"
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process old data
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database, min, total_max, callback) {
  // find the lowest date in database and go from that date to present
  var data = JSON.parse(fs.readFileSync(data_file, 'utf8'));

  var inst_list = get_inst_list(data);
  var revision = Number(data.revision); // int not string
  var data = transform_data(data.data);

  var max = new Date(min);
  max.setDate(max.getDate() + 1);   // next day

  async.whilst(function () {
    return min <= total_max;
  },
  function(next) {
    async.series([
      function(done) {
        search(database, data, revision, min, max, inst_list, done);     // calls done when finished
      },
      function(done) {
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
      console.error(err);
    else
      console.log("cron task concurrent_users finished processing old data");

    update_revision(database, revision, callback);
  });
};
// --------------------------------------------------------------------------------------
// transform data
// --------------------------------------------------------------------------------------
function transform_data(data)
{
  var ret = {};

  for(var item in data) {
    ret[data[item].institution] = {};

    for(var inst in data[item].institutions) {
      ret[data[item].institution][data[item].institutions[inst].institution] = {};

      ret[data[item].institution][data[item].institutions[inst].institution]["dist"] = data[item].institutions[inst].dist;
      ret[data[item].institution][data[item].institutions[inst].institution]["time"] = data[item].institutions[inst].time;
    }
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// get institution list
// --------------------------------------------------------------------------------------
function get_inst_list(data)
{
  var arr = [];

  for(var item in data.data[0].institutions) {
    arr.push(data.data[0].institutions[item].institution);
  }

  return arr;
}
// --------------------------------------------------------------------------------------
// perform mac address counting
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  var data = JSON.parse(fs.readFileSync(data_file, 'utf8'));
  var curr = new Date();        // current day
  curr.setHours(0);
  curr.setMinutes(0);
  curr.setSeconds(0);
  curr.setMilliseconds(0);
  var prev_min = new Date(curr);
  prev_min.setDate(prev_min.getDate() -1); // previous day hh:mm:ss:ms set to 00:00:00:000
  var prev_max = new Date(curr);           // current day hh:mm:ss:ms set to 00:00:00:000
                                           // search uses lower than max condition !

  var inst_list = get_inst_list(data);
  var revision = Number(data.revision); // int not string
  var data = transform_data(data.data);

  async.series([
    function(callback) {
      search(database, data, revision, prev_min, prev_max, inst_list, callback);
    },
    function(callback) {
      update_revision(database, revision, callback);
    }
  ],
  function(err, results) {
  });
};
// --------------------------------------------------------------------------------------
// update revision in db
// --------------------------------------------------------------------------------------
function update_revision(database, revision, callback)
{
  // add new revision to array, sort all ascending
  database.concurrent_rev.update({}, { $addToSet : { revisions : revision } }, { upsert : true },
  function(err, result) {
    if(err)
      console.error(err);

    if(callback)
      callback(null, null);
  });
}
// --------------------------------------------------------------------------------------
// search input data inteligently
// --------------------------------------------------------------------------------------
function search(database, data, revision, min, max, inst_list, done)
{
  var items = [];
  var cursor = database.logs.aggregate([
    { $match :
      { timestamp : { $gte : min, $lt : max },               // limit by timestamp
        pn : { $nin : [ "", /^anonymous@.*$/, /^@.*$/ ] },   // no empty or anonymous users
        result : "OK",                                       // successfully authenticated only
        //visinst : { $in : [ inst_list ] }                  // TODO ?
       }
    },
    { $group :
      {
        _id :   // group by : pn, timestamp, visinst, csi
        {
          pn : "$pn",
          timestamp : "$timestamp",
          visinst : "$visinst",
          csi : "$csi"
        }
      }
    },
    { $project : { pn : "$_id.pn", timestamp : "$_id.timestamp", visinst : "$_id.visinst", csi : "$_id.csi", "_id" : 0 }},
    { $sort : { pn : 1, timestamp : 1 }}
  ]).allowDiskUse(true).cursor({ batchSize: 1000 }).exec();

  cursor.on('error', function(err) {
    console.err(err);
    done(null);
  });

  cursor.on('data', function(item) {
    items.push(item);
  });

  cursor.on('end', function() {
    analyze_src_dst(database, items, data, min, revision, inst_list, done);
  });
}
// --------------------------------------------------------------------------------------
// analyze data based on all known institutions as source and destination
// --------------------------------------------------------------------------------------
function analyze_src_dst(database, items, data, min, revision, inst_list, done)
{
  var structured_data = {};

  // prepare data structure
  for(var src in inst_list)
    structured_data[inst_list[src]] = {};   // dict data, key is source inst name

  // create data
  for(var item in items) {
    if(inst_list.indexOf(items[item].visinst) != -1) {       // check that the visinst exists
      if(structured_data[items[item].visinst][items[item].pn] === undefined)
        structured_data[items[item].visinst][items[item].pn] = [];

      structured_data[items[item].visinst][items[item].pn].push(items[item]);   // add data
    }
  }
  // strctured data:
  // {
  //   inst_name : {
  //     user1 : [ {}, {}, {} ... ]
  //     user2 : [ {}, {}, {} ... ]
  //     ..
  //   }
  // }


  for(var src in inst_list) {
    for(var dst in inst_list) {
      if(inst_list[src] == inst_list[dst])
        continue;

      analyze_data(database, structured_data, data, inst_list[src], inst_list[dst], min, revision, inst_list);
    }
  }

  done(null);
}
// --------------------------------------------------------------------------------------
// analyze all records for one user and two visited institutions
// --------------------------------------------------------------------------------------
//function analyze_data(database, items, data, min, revision, inst_list, done)
function analyze_data(database, items, data, src, dst, min, revision, inst_list, done)
{
  // items are implicly sorted by username and time

  if(items[src] == {}) {    // no data available
    return;
  }

  var db_data = [];
  
  for(var user in items[src]) {
    if(items[dst][user]) {      // user exists in dest inst

      for(var src_rec in items[src][user]) {
        for(var dst_rec in items[dst][user]) {
          if((items[dst][user][dst_rec].timestamp - items[src][user][src_rec].timestamp) / 1000 < data[src][dst].time) {
            if(items[dst][user][dst_rec].timestamp - items[src][user][src_rec].timestamp >= 0) {
              var item = {
                timestamp     : min,
                timestamp_1   : items[src][user][src_rec].timestamp,
                timestamp_2   : items[dst][user][dst_rec].timestamp,
                visinst_1     : items[src][user][src_rec].visinst,
                visinst_2     : items[dst][user][dst_rec].visinst,
                username      : user,
                mac_address_1 : items[src][user][src_rec].csi,
                mac_address_2 : items[dst][user][dst_rec].csi,
                time_needed   : Math.round(data[src][dst].time),
                dist          : Math.round(data[src][dst].dist),
                revision      : revision
              };

              db_data.push(item);
            }
          }
        }
      }
    }
  }

  // ==========================================
  // save to db

  if(done)
    save_to_db_callback(database, db_data, done);
  else
    save_to_db(database, db_data);
}
// --------------------------------------------------------------------------------------
// save data to dabase
// --------------------------------------------------------------------------------------
function save_to_db(database, items) {
  for(var item in items) {  // any better way to do this ?
    database.concurrent_users.update(items[item], items[item], { upsert : true },
    function(err, result) {
      if(err)
        console.error(err);
    });
  }
}
// --------------------------------------------------------------------------------------
// save data to database with callback
// --------------------------------------------------------------------------------------
function save_to_db_callback(database, items, done) {
  async.forEachOf(items, function (value, key, callback) {
    database.concurrent_users.update(items[key], items[key], { upsert : true },
    function(err, result) {
      if(err)
        console.error(err);
      callback(null);   // save next item
    });
  }, function (err) {
    if (err)
      console.error(err);
    done(null, null);   // all items are saved
  });
}
// --------------------------------------------------------------------------------------
module.exports = exp;

