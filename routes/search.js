var express = require('express');
var router = express.Router();
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  // if query string empty
  if (Object.keys(req.query).length === 0) {
    console.log("query string empty");
    res.render('search', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
  }
  else {
    console.log("query string not empty");
    search(req, res, respond);
    //res.render('search', { title: 'Ukazkove rozhrani pro vyhledavani nad radius logy' });
  }
  // else
  // angular -> request na stejnou url bez reloadu ?
  // po odeslani formu nastaveni query stringu
  // query string na zaklade obsahu formu
  // http://stackoverflow.com/questions/17491054/append-url-parameters-dynamically-angularjs
  //
  //
  //

});
// --------------------------------------------------------------------------------------
// TODO
//router.post('/', function(req, res, next) {
//  search(req, res, next, respond);
//});
// --------------------------------------------------------------------------------------
function search(req, res, next) {
  var dict = {};

  // TODO - keys validation

  // debug
  console.log("req.query:");
  console.log(req.query);


  // TODO
  //if(req.query.username == "" && req.query.mac == "")   /* no main search key was entered */
  //  return res.json([]);     // do not search database 

  console.log(req.query.username);

  //if(req.query.username != "")
  //  dict["pn"] = req.query.username;
  
  if(req.query.mac_address != "")
    dict["csi"] = req.query.mac_address;
  
  //if(req.query.result != "nezadáno")
  //  dict["result"] = req.query.result;
 
  //
  //// TODO
  //if(req.query.from != undefined) {
  //  dict["timestamp"] = {};
  //  dict["timestamp"]["$gte"] = req.query.from;
  //}
  //
  //if(req.query.to != undefined) {
  //  if(dict["timestamp"] == undefined)
  //    dict["timestamp"] = {};
  //  dict["timestamp"]["$lt"] = req.query.to;
  //}
  
  // TODO - pridat razeni dle data od nejstarsiho po nejnovejsi ?

  // debug
  console.log("dict:");
  console.log(dict);

  req.db.logs.find(dict, { _id: 0 }, function (err, items) {      // do not display object id in result
    respond(err, items, res)
  });
}
// --------------------------------------------------------------------------------------
function respond(err, items, res) {
  if(err) {
    console.log(err);
    res.send(err);
    return;
  }
  
  // debug
  //console.log(items);

  res.json(items);
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

module.exports = router;
