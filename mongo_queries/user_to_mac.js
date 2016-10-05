// raw mongo shell query for collection user_to_mac
// this is just for debugging purposes

// use as "mongo etlog mongo_queries/user_to_mac.js"

var max = new Date();           // today
var min = new Date(max);    
min.setDate(min.getDate() -1);  // the day before
var out = db.logs.aggregate([ { $match : { timestamp : { $gte : min, $lt : max }, pn : { $ne : "" }, csi : { $ne : "" }, result : "OK" } }, { $project : { pn : 1, csi : 1 } }, { $group : { _id : { pn : "$pn", csi : "$csi"  } } }, { $group : { _id : { pn : "$_id.pn" }, addrs : { $addToSet : "$$ROOT._id.csi" } } } ])

printjson(out)

