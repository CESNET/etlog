const nodemailer = require('nodemailer');
const config = require('./config/config.js');
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
    from: 'etlog@etlog.cesnet.cz <etlog@etlog.cesnet.cz>', // sender address
    cc: 'vac.mach@sh.cvut.cz',  // copy
  };

  return {
    transporter : transporter,
    mail_options : mail_options
  };
}
// --------------------------------------------------------------------------------------
// send mail with defined subject and data
// --------------------------------------------------------------------------------------
module.exports.send_mail = function (subject, recipients, data)
{
  var mailer = set_up_mailer();     // set up
  mailer.mail_options.subject = subject;  // set mail subject
  mailer.mail_options.text = data;  // set mail text
  mailer.mail_options.to = recipients;   // set recipients

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
  database.realm_admins.find({}, { realm : 1, admins : 1, _id : 0 },
  function(err, items) {
    for(var dict in items) {
      // items[dict].realm contains domain part of username - eg "fit.cvut.cz"
      module.exports.send_mail(config.failed_logins_subj, items[dict].admins, data_func(database, items[dict].realm, limit));
    }
  });
}
// --------------------------------------------------------------------------------------
module.exports.send_error_report = function (data)
{
  var subj = "hlášení o chybě";
  recipients = [ 'vac.mach@sh.cvut.cz' ];
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
