const nodemailer = require('nodemailer');
const config = require('./config/config.js');
const fs = require('fs');
// --------------------------------------------------------------------------------------
function set_up_mailer()
{
  // create transporter
  var transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    requireTLS : false,
    ignoreTLS : true
  });
  
  // setup e-mail data with unicode symbols
  var mail_options = {
    from: config.mail_from_address,         // sender address
    replyTo: config.mail_replyto_address    // reply to
  };

  return {
    transporter : transporter,
    mail_options : mail_options
  };
}
// --------------------------------------------------------------------------------------
// send mail with defined subject and data
// --------------------------------------------------------------------------------------
module.exports.send_mail = function (subject, recipients, data, bcc)
{
  var mailer = set_up_mailer();     // set up
  mailer.mail_options.subject = subject;  // set mail subject
  mailer.mail_options.text = data;  // set mail text
  mailer.mail_options.to = recipients;   // set recipients

  if(bcc)       // set up bcc if provided
    mailer.mail_options.bcc = bcc;

  // send mail with defined transport object
  mailer.transporter.sendMail(mailer.mail_options, function(error, info) {
    if(error) {
      return console.error(error);
    }
    console.log('Message sent: ' + info.response);
  });
}
// --------------------------------------------------------------------------------------
// send mail to all defined realm admins
// params:
// 1) database
// 2) mail subject
// 3) function which returns data - mail contents
// 4) optional limit for data function
// --------------------------------------------------------------------------------------
module.exports.send_mail_to_realm_admins = function (database, data_func, limit)
{
  var bcc = config.radius_admin;

  disable_admins_sync();    // disable synchronization when sending notifications

  database.realm_admins.find({ notify_enabled : true }, { realm : 1, admin : 1, _id : 0 },
  function(err, items) {
    for(var dict in items) {
      if(items[dict].realm == "cz") {       // exception for "cz" realm
        module.exports.send_mail(config.failed_logins_subj, items[dict].admin, data_func(database, items[dict].realm, limit));
      }
      else {
        // items[dict].realm contains domain part of username - eg "fit.cvut.cz"
        module.exports.send_mail(config.failed_logins_subj + " | " + items[dict].realm,         // specify realm in subject
                                 items[dict].admin, data_func(database, items[dict].realm, limit), bcc);
      }
    }

    enable_admins_sync();   // enable synchronization
  });
}
// --------------------------------------------------------------------------------------
// enable realm admins synchronization
// --------------------------------------------------------------------------------------
function enable_admins_sync()
{
  fs.unlink(config.etlog_log_root + "/ldap/sync_disabled", function(err) {
    if(err) {
      console.eror(err);
    }
  });
}
// --------------------------------------------------------------------------------------
// disable realm admins synchronization
// --------------------------------------------------------------------------------------
function disable_admins_sync()
{
  fs.writeFile(config.etlog_log_root + "/ldap/sync_disabled", "", function(err) {
    if(err) {
      console.eror(err);
    }
  });
}
// --------------------------------------------------------------------------------------
module.exports.send_error_report = function (data)
{
  var subj = "hlášení o chybě";
  recipients = [ 'machv@cesnet.cz' ];
  var mail_data = "";

  for(var item in data) {
    mail_data += data[item].stack + "\n";
  }

  module.exports.send_mail(subj, recipients, mail_data);
}
// --------------------------------------------------------------------------------------
// send error report about detected service problem
// --------------------------------------------------------------------------------------
module.exports.send_service_problem_notification = function(database, realm, data)
{
  var subj = "problém fungování služby eduroam";

  database.realm_admins.find({ realm : realm  }, { admins : 1, _id : 0 },
  function(err, items) {
    for(var dict in items) {
      module.exports.send_mail(subj, items[dict].admins, data);
    }
  });
}
// --------------------------------------------------------------------------------------
