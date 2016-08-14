// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// function for old data
// process old data through days, until current day 
exp.process_old_data = function (database) {
    console.log("process_old_data");

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
    // TODO - timestamp
    
  min_date = new Date("2015-04-24T00:00:00Z");
  max_date = new Date(min_date.getTime() + 86400000);

  database.logs.aggregate([ 
    { 
      $match : 
        {
          timestamp :             // TODO
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
};
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
