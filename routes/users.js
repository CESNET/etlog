// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// get basic user info
// return object with all important properties
// --------------------------------------------------------------------------------------
exp.get_user = function(headers)
{
  var user = {};

  // characters can be incorrectly encoded - should be utf-8, but in fact are iso 8859-1
  //user.display_name = headers["displayname"];
  //user.last_name = headers["sn"];

  user.username = headers["remote_user"];
  user.groups = parse_groups(headers["perununiquegroupname"]);

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
    //if(list[item] == "einfra:realmAdmins")
    //  ret.push(["realm_admin"]);   // realm admin
  }

  return ret;
}
// --------------------------------------------------------------------------------------
module.exports = exp;
