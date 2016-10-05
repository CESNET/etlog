// raw mongo shell query for collection mac_count
// this is just for debugging purposes

// use as "mongo etlog mongo_queries/mac_count.js"

var max = new Date();           // today
var min = new Date(max);    
min.setDate(min.getDate() -1);  // the day before
var out = db.logs.aggregate([ { $match : { timestamp :{ $gte : min, $lt : max }, pn :{ $ne : ""}, csi : { $ne : ""}, result : "OK"} }, { $project :{pn : 1, csi : 1, timestamp : 1 } }, { $group :{ _id : { pn : "$pn", csi : "$csi" }} }, { $group : { _id :  { username : "$_id.pn"}, count : { $sum : 1 }, addrs : { $addToSet : "$_id.csi"}} }, { $match : { count : { $gt : 2} } }])
printjson(out)

