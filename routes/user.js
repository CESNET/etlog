// --------------------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
// return basic info about user
// --------------------------------------------------------------------------------------
router.get('/info', function(req, res, next) {
  respond(get_user(req.headers), res);
});
// --------------------------------------------------------------------------------------
// return basic info about user
// --------------------------------------------------------------------------------------
router.get('/set_role/:role', function(req, res, next) {
  respond(set_user_role(req.headers, req.params), res);
});
// --------------------------------------------------------------------------------------
// get basic user info
// return object with all important properties
// --------------------------------------------------------------------------------------
function get_user(headers)
{
  var user = {};

  // characters can be incorrectly encoded - should be utf-8, but in fact are iso 8859-1
  //user.display_name = headers["displayname"];
  //user.last_name = headers["sn"];

  user.username = headers["remote_user"];
  user.groups = parse_groups(headers["perununiquegroupname"]);
  user.role = user.groups[user.groups.length - 1];      // default role is the highest available
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

  for(var item in list) {
    if(list[item] == "einfra:eduroamAdmins")
      ret.push("realm_admin", "admin");   // global admin is also a realm admin
    
    // TODO
    // TODO - array of realms the admin is administrating
    //if(list[item] == "einfra:realmAdmins")
    //  ret.push(["realm_admin"]);   // realm admin
  }

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
}
// --------------------------------------------------------------------------------------
// set user role
// --------------------------------------------------------------------------------------
function set_user_role(headers, params)
{
  var user = get_user(headers);

  switch(params.role) {
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
