// --------------------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const config = require('../config/config');
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

  // characters can be incorrectly encoded - should be utf-8, but in fact are iso 8859-1
  //user.display_name = headers["displayname"];
  //user.last_name = headers["sn"];

  user.username = req.headers["remote_user"];
  user.identities = get_eduroam_identities(req.headers);
  user.groups = [];
  for(var group in config.role_groups) {
    var temp = parse_groups(req.headers[config.role_groups[group]]);

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
function parse_groups(group_list)
{
  var ret = [ "user" ];         // everyone is at least a user

  var list = group_list.split(";");

  // realm_admins
  for(var group in config.realm_admin_groups) {
    for(var item in list) {
      if(list[item] == config.realm_admin_groups[group]) {
        ret.push("realm_admin");
        break;
      }
    }
  }

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
function set_realms(user)
{
  if(user.role != "realm_admin")
    return;     // applies only for realm admin

  user.administered_realms = get_administered_realms(user.username);
}
// --------------------------------------------------------------------------------------
// get array of administered realms for given username
// --------------------------------------------------------------------------------------
function get_administered_realms(username)
{
  var ret = [];

  // "hack" using remote_user/eppn for now
  ret.push(username.replace(/.*@/, ""));

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

  set_realms(user, req);
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
