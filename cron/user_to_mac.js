// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// process old data through days until current day 
// --------------------------------------------------------------------------------------
exp.process_old_data = function (database) {
  // find the lowest date in database and go from that date to present
  var date;

  // find all, sort by timestamp, display only timestamp, display one document only
  database.logs.find({ query : {}, $orderby : { timestamp : 1 } } , { timestamp : 1, _id : 0 }, { limit : 1 },
  function(err, doc) {
    var date = doc;

    date = String(date[0]["timestamp"]);    // get only string representation of date

    var fields = date.split(" ");
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

    date = new Date(fields[3], months[fields[1]], fields[2]);   // hh:mm:ss set to 0
    var next_date = new Date(date.getTime() + 86400000);        // next day

    while(date < current) {
      process_data(database, date, next_date);
      date = next_date;                         // continue
      next_date = new Date(date.getTime() + 86400000);  // next day
    }
    console.log("cron task users_to_mac finished processing old data");
  });
};
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// function for current day
// just for current day
// run once an hour          ???? maybe more often ?
// --------------------------------------------------------------------------------------
// map usernames to mac addresses
// --------------------------------------------------------------------------------------
exp.process_current_data = function (database) {
  min_date = new Date();        // current day
  max_date = new Date(min_date.getTime() + 86400000);   // the next day

  process_data(database, min_date, max_date);
};
// --------------------------------------------------------------------------------------
function process_data(database, min_date, max_date)
{
  database.logs.aggregate([ 
    { 
      $match : 
        {
          timestamp :             // get only data for current day
            {
              $gte : min_date, 
              $lt : max_date 
            }, 
          pn : 
            { 
              $ne : ""            // only non empty usernames
            }
          //  , 
          //csi :                 // data can contain records where one mac address is empty for certain username, we also want to includes these records
          //  {           
          //    $ne : ""            // only non empty mac addresses
          //  } 
        } 
    }, 
    { 
      $project :                  // need only username and mac address
        { 
          pn : 1, 
          csi : 1 
        } 
    }, 
    { 
      $group :                    // group by pair [ username, mac address ]
        { 
          _id : 
            { 
              pn : "$pn", 
              csi : "$csi" 
            } 
        } 
    }, 
    { 
      $group :                    // group again by username
        { 
          _id : 
            { 
              pn : "$_id.pn" 
            }, 
            addrs : 
              { 
                $addToSet : "$$ROOT._id.csi"  // add mac addresses for matching username to array
              } 
        } 
    },
    //{
    //  $out : "users_mac"       // write result to collection
    //}
    ],

    function(err, items) {
      transform(items, database);
    });
}
// --------------------------------------------------------------------------------------
// transform data and update database
// --------------------------------------------------------------------------------------
function transform(items, database)
{
  dict = {};

  for(var item in items) {
    var key = items[item];
    dict["username"] = key._id.pn;  // save username
    dict["addrs"] = key.addrs;  // save array of mac addressses

    database.users_mac.update(
      {                                 // query
        "username" : dict["username"]
      },
      {                                 // update
        "username" : dict["username"],  // set username
        $addToSet :                     // add mac addresses to array
          {
            "addrs" : 
              { 
                $each : dict["addrs"]   // each one separately not whole array
              }     
          } 
      },
      { 
        upsert : true                   // update if matching document is found
      }, 
      function (err, result) {
        // nothing to do here
        // update needs a function to work
    });
  }
}
// --------------------------------------------------------------------------------------
module.exports = exp;
