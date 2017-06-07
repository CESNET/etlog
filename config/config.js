// etlog confoguration file
// ==========================================================================================
// javascript variables used in etlog project
// ==========================================================================================
module.exports = {
  // number of failed logins records which will be send to the administrators
  failed_logins_lines : 100,
  // subject of failed logins report
  failed_logins_subj : "měsíční report - neúspěšná přihlášení",
  // ipv4 listening address
  ipv4 : '127.0.0.1',
  // ipv6 listening address
  ipv6 : '::1',
  // server dns name
  server_name : 'etlog-dev.cesnet.cz',
// ==========================================================================================
  // mapping of groups to privilege levels
  // defines where to look for additional privilege information
  role_groups : [ "perununiquegroupname" ],
  // defines mapping to admin privilege level
  admin_groups : [ "einfra:eduroamManagers" ],
}
// ==========================================================================================
