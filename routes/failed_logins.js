var express = require('express');
var router = express.Router();

/* GET home page. */
//router.get('/', function(req, res, next) {
//  var realm = [ "vutbr.cz", "cuni.cz", "upce.cz", "vse.cz" ];
//  var count = {};
//  var size = realm.length;
//
//  //console.log(realm);
//  //console.log(size);
//
//// -----------------------------------------------------------------
//
//  // veskere unikatni realmy
//  //req.db.record.distinct("realm", function (err, items) {
//  //  if(err)
//  //    res.send(err);
//  //  res.json(items);
//  //});
//
//// -----------------------------------------------------------------
//
//  //for(var i = 0; i < size; i++) {
//  //  console.log(realm[i]);
// 
//  //  count[realm[i]] = i;
//  //  //console.log("count: " + count);
//  //  //console.log(count);
//  //  //console.log("realm[i]: " + realm[i]);
//  //  
//  //  count[realm[i]] = req.db.record.find({"realm" : realm[i]}, function (err, items) {
//  //    if(err)
//  //      res.send(err);
// 
//  //    //console.log("--------------");
//  //    //console.log(count);
//  //    //console.log(i);
//  //    //console.log(realm);
//  //    //console.log(realm[i]);
//  //    //console.log("--------------");
// 
//  //    
//  //    //console.log(realm[i]);
//  //    console.log(items.count);
//  //    //return items.count;     
//  //  });
//  //}
// 
//  ////console.log(count);
//  //res.json(count);
//
//// -----------------------------------------------------------------
// 
//  // funguje OK - cca 35 sec
//  //req.db.record.find({"realm" : "vutbr.cz"}, function (err, items) {
//  //  if(err)
//  //    res.send(err);
//  //  
//  //  count["vutbr.cz"] = items.length;
//  //  console.log(count);
//  //  //res.json(count);
//  //  reply(res, count);
//  //});
//
//// -----------------------------------------------------------------
//     
//  req.db.record.find({"realm" : "vutbr.cz"}, function (err, items) {
//    if(err)
//      res.send(err);
//    count["vutbr.cz"] = items.length;
//    console.log("nalezeno 1");
//    res.json(count);
//  });
//
//  console.log("1");
//
//  //req.db.record.find({"realm" : "cuni.cz"}, function (err, items) {
//  //  if(err)
//  //    res.send(err);
//  //  count["cuni.cz"] = items.length;
//  //  console.log("nalezeno 2");
//  //});
//
//  console.log("2");
//
//  req.db.record.find({"realm" : "upce.cz"}, function (err, items) {
//    if(err)
//      res.send(err);
//    count["upce.cz"] = items.length;
//    console.log("nalezeno 3");
//  });
//
//  console.log("3");
//
//  //req.db.record.find({"realm" : "vse.cz"}, function (err, items) {
//  //  if(err)
//  //    res.send(err);
//  //  count["vse.cz"] = items.length;
//  //  res.json(count);
//  //  console.log("nalezeno 4");
//  //});
//  
//  console.log("4");
//});
//
//// -----------------------------------------------------------------
//
//function pausecomp(millis)
// {
//   var date = new Date();
//   var curDate = null;
//   do { curDate = new Date(); }
//   while(curDate-date < millis);
// }
//
//// -----------------------------------------------------------------
//
//function reply(res, count, realm) {
//  while(realm == undefined) {
//    pausecomp(10000);
//    console.log(count);
//  }
//  
//  console.log(count);
//  res.json(count);
//}
//
//// -----------------------------------------------------------------




router.get('/', function(req, res, next) {
  
  console.log(req.server);

  res.render('failed_logins', { title: 'vyhledávání neúspěšných pokusů o ověření' });

  //var color = req.param('color');

});
module.exports = router;
