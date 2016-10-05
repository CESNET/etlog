// raw mongo shell query for collection roaming
// this is just for debugging purposes

// use as "mongo etlog mongo_queries/roaming.js"

var max = new Date();           // today
var min = new Date(max);    
min.setDate(min.getDate() -1);  // the day before

// most providing roaming
var out1 = db.logs.aggregate([ { $match : { timestamp : { $gte : min, $lt : max }, result : "OK" } }, { $group : { _id : { realm : "$realm",  csi : "$csi" 
 } } }, { $project :  { "_id.realm" : 1 } }, { $group : { _id : { realm : "$_id.realm" }, count : { $sum : 1 } } } ])

// most using roaming
var out2 = db.logs.aggregate([ { $match : { timestamp : { $gte : min, $lt : max }, result : "OK", visinst : { $ne : "UNKNOWN" } } }, { $group : { _id : { visinst : "$visinst", csi : "$csi" } } }, { $project : { "_id.visinst" : 1 } }, { $group : { _id : { visinst : "$_id.visinst" }, count : { $sum : 1 } } }])

printjson(out1)
printjson(out2)

