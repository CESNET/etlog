// raw mongo shell query for collection failed_logins
// this is just for debugging purposes

// use as "mongo etlog mongo_queries/failed_logins.js"

var max = new Date();           // today
var min = new Date(max);    
min.setDate(min.getDate() -1);  // the day before
var out = database.logs.aggregate([ { $match : { timestamp :{ $gte : min, $lt : max }, pn : { $ne : ""} } }, { $project : { timestamp : 1, pn : 1, result : 1} },  { $group : { _id : { pn : "$pn", result : "$result" }, count : { $sum : 1 } } }, { $group : { _id : { pn : "$_id.pn" }, results : { $addToSet : "$$ROOT._id.result" }, result_count : { $addToSet : "$count" }, } }, { $match : { results : { $in : [ "FAIL" ] } } }]) 
printjson(out)

