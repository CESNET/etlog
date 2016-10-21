const nodemailer = require('nodemailer');
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
    from: 'etlog <etlog@etlog.cesnet.cz>', // sender address
    //to: 'jan.tomasek@cesnet.cz', // list of receivers TODO
    to: 'vac.mach@sh.cvut.cz',  // copy 
    //cc: 'vac.mach@sh.cvut.cz',  // copy     // TODO set this as production
    //subject: 'test', // Subject line      // TODO
    //text: '' // plaintext body        // TODO
    //text: 'testovaci email' // plaintext body        // TODO
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
      return console.log(error);
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
  database.realm_admins.find({ query : {}, $orderby : { timestamp : 1 } } , { realm : 1, admins : 1, _id : 0 },
  function(err, items) {
    for(var dict in items) {
      // items[dict].realm contains domain part of username - eg "fit.cvut.cz"

      // TODO - sort by length ?
      // TODO - possible duplicates across realms - needs to be solved ?

      // TODO - possible problem with mapping of username to realm - needs to be solved?
      // possible workaround - search each username separately and get realm value there

      data_func(items[dict].realm, items[dict].admins, limit, module.exports.send_mail);
    }
  });
}
// --------------------------------------------------------------------------------------
