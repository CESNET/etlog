// etlog confoguration file
// ==========================================================================================
// javascript variables used in etlog project
// ==========================================================================================
module.exports = {
  // number of failed logins records which will be send to the administrators
  failed_logins_lines : 100,
  // subject of failed logins report
  failed_logins_subj : "měsíční report - neúspěšná přihlášení",
  // email of national radius admin
  radius_admin : "jan.tomasek@cesnet.cz",
  // from email address set for outgoing mails
  mail_from_address: 'etlog@etlog.cesnet.cz <etlog@etlog.cesnet.cz>',
  // reply to email address set for outgoing mails
  mail_replyto_address: 'info@eduroam.cz',
  // ipv4 listening address
  ipv4 : '127.0.0.1',
  // ipv6 listening address
  ipv6 : '::1',
  // server dns name
  server_name : 'etlog.cesnet.cz',
  // etlog log root
  etlog_log_root : '/home/etlog/logs/',
// ==========================================================================================
  // mapping of groups to privilege levels
  // defines where to look for additional privilege information
  role_groups : [ "perununiquegroupname" ],
  // defines mapping to admin privilege level
  admin_groups : [ "einfra:eduroamManagers" ],
}
// ==========================================================================================
