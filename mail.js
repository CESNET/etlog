const nodemailer = require('nodemailer');
const config = require('./config/config.js');
const fs = require('fs');
const async = require('async');
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
module.exports.send_mail = function (subject, recipients, data, bcc, callback)
{
  var mailer = set_up_mailer();     // set up
  mailer.mail_options.subject = subject;  // set mail subject
  if(typeof(data) === 'object') {      // data is probably a dict - both html and plain?
    mailer.mail_options.text = data.plain; // set mail text
    mailer.mail_options.html = data.html;  // set mail html
    mailer.mail_options.attachments = [{   // set attachment
      filename : 'data.csv',
      content  : data.att,
      contentType : 'text/csv; charset=utf-8'
    }];
  }
  else {
    mailer.mail_options.text = data;  // set mail text
  }
  mailer.mail_options.to = recipients;   // set recipients

  if(bcc)       // set up bcc if provided
    mailer.mail_options.bcc = bcc;

  // send mail with defined transport object
  mailer.transporter.sendMail(mailer.mail_options, function(error, info) {
    if(error) {
      return console.error(error);
      callback();
    }
    console.log('Message sent: ' + info.response);

    if(callback)
      callback();
  });
}
// --------------------------------------------------------------------------------------
// send mail to all defined realm admins
// params:
// 1) database
// 2) data function
// 3) mail subject
// 4) params to data function
// 5) callback
// --------------------------------------------------------------------------------------
module.exports.send_mail_to_realm_admins = function (database, data_func, subj, func_params, done)
{
  var bcc = config.radius_admin;

  database.realms.find({}, { _id : 0 },
    function(err, realms) {
      async.forEachOfSeries(realms, function (record, key, callback) {

        database.realm_admins.find({ notify_enabled : true, realm : record.realm }, { admin : 1, _id : 0 },    // get admins for specific realm
          function(err, items) {
            var to = "";

            for(var item in items) {
              to += items[item].admin + ",";        // one mail to all admins
            }
            var data = data_func(database, record.realm, func_params);

            if(data != "" && data != undefined) {    // do not send mail when no data for current realm are available
              if(record.realm == "cz") {       // exception for "cz" realm
                module.exports.send_mail(subj, to, data, null, callback);  // no bcc
              }
              else {
                // realms[realm].realm contains domain part of username - eg "fit.cvut.cz"
                module.exports.send_mail(subj + " | " + record.realm,         // specify realm in subject
                                         to, data, bcc, callback);
              }
            }
            else {
              callback();       // callback when no data are available
            }
          });
      }, function(err) {
        done(null);
      });
  });
}
// --------------------------------------------------------------------------------------
module.exports.send_error_report = function (data)
{
  var subj = "hlášení o chybě";
  recipients = [ 'etlog@localhost' ];
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
// send statistics about compromised users for all known realms
// --------------------------------------------------------------------------------------
module.exports.send_realm_stats = function(database, data_func, to, func_param, done)
{
  database.realms.find({}, { _id : 0 },
    function(err, realms) {
      var data = data_func(realms, func_param);
      module.exports.send_mail("kompromitované identity - statistiky",         // specify realm in subject
                                 to, data, null, done);     // no bcc
  });
}
// --------------------------------------------------------------------------------------
