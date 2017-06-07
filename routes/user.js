// --------------------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const config = require('../config/config');
const deasync = require('deasync');
// --------------------------------------------------------------------------------------
// return basic info about user
// --------------------------------------------------------------------------------------
router.get('/info', function(req, res, next) {
  if(!req.session.user)
    req.session.user = get_user(req);
  respond(req.session.user, res);
});
// --------------------------------------------------------------------------------------
// return basic info about user
// --------------------------------------------------------------------------------------
router.get('/set_role/:role', function(req, res, next) {
  req.session.user = set_user_role(req);
  respond(req.session.user, res);
});
// --------------------------------------------------------------------------------------
// get basic user info
// return object with all important properties
// --------------------------------------------------------------------------------------
function get_user(req)
{
  var user = {};

  user.username = req.headers["remote_user"];
  user.identities = get_eduroam_identities(req.headers);
  user.groups = [];
  for(var group in config.role_groups) {
    var temp = parse_groups(req, user.username, req.headers[config.role_groups[group]]);

    for(role in temp)
      user.groups.push(temp[role]);
  }
  user.role = user.groups[user.groups.length - 1];      // default role is the highest available
  set_realms(req, user);
  set_display_role(user);

  return user;
}
// --------------------------------------------------------------------------------------
// returns list of users permission
// --------------------------------------------------------------------------------------
function parse_groups(req, username, group_list)
{
  var ret = [ "user" ];         // everyone is at least a user
  var done = false;
  var list = group_list.split(";");

  // search for realm admins locally in the database
  req.db.realm_admin_logins.find({ "admin" : username }, function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    }

    if(items.length > 0)    // username has realm admin privilege
      ret.push("realm_admin");
    done = true;
  });

  deasync.loopWhile(function() {
    return !done;
  });

  // admins
  for(var group in config.admin_groups) {
    for(var item in list) {
      if(list[item] == config.admin_groups[group]) {
        if(ret.indexOf("realm_admin") == -1)
          ret.push("realm_admin", "admin");   // global admin is also a realm admin

        else
          ret.push("admin");   // realm admin included from previous loop

        break;
      }
    }
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// get eduroam identity
// may be different from username and one user may have more identities
// --------------------------------------------------------------------------------------
function get_eduroam_identities(headers)
{
  var ret = [];

  if(headers["eduroamuid"]) {    // special eduroam identity attribute
    var identities = headers["eduroamuid"].split(';');
    for(var id in identities) {
      ret.push(identities[id]);
    }
  }
  else   // "hack" using remote_user/eppn for users, which do not supply eduroamuid attribute
    ret.push(headers["remote_user"]);

  return ret;
}
// --------------------------------------------------------------------------------------
// set array of administered realms if the user is realm admin
// --------------------------------------------------------------------------------------
function set_realms(req, user)
{
  if(user.role != "realm_admin")
    return;     // applies only for realm admin

  user.administered_realms = get_administered_realms(req, user.username);
}
// --------------------------------------------------------------------------------------
// get array of administered realms for given username
// --------------------------------------------------------------------------------------
function get_administered_realms(req, username)
{
  var done = false;
  var ret = [];

  req.db.realm_admin_logins.find({ "admin" : username }, { _id : 0, administered_realms : 1 }, function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    }

    if(items.length > 0)    // array of administered realms
      ret = items[0].administered_realms;
    else                    // "hack" using remote_user/eppn for now
      ret.push(username.replace(/.*@/, ""));

    done = true;
  });


  deasync.loopWhile(function() {
    return !done;
  });

  return ret;
}
// --------------------------------------------------------------------------------------
// set display role
// --------------------------------------------------------------------------------------
function set_display_role(user)
{
  user.display_role = user.role;

  if(user.display_role == "user")
    user.display_role = "uživatel";     // only to display correct language variant in frontend

  if(user.display_role == "realm_admin")
    user.display_role = "realm admin";     // no undescore
}
// --------------------------------------------------------------------------------------
// set user role
// --------------------------------------------------------------------------------------
function set_user_role(req)
{
  var user = get_user(req);

  switch(req.params.role) {
    case "user":
      user.role = "user";       // anyone with higher privs can be a user
      break;

    case "realm_admin":
      if(user.groups.length > 1)
        user.role = "realm_admin";       // only realm_admin or admin can become realm_admin
      break;

    case "admin":
      if(user.groups.length > 2)
        user.role = "admin";       // only admin can become admin
      break;
  }

  set_realms(req, user);
  set_display_role(user);

  return user;
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
