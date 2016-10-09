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
module.exports.send_mail = function (subject, data)
{
  var mailer = set_up_mailer();     // set up
  mailer.mail_options.subject = subject;  // set mail subject
  mailer.mail_options.text = data;  // set mail text

  // send mail with defined transport object
  mailer.transporter.sendMail(mailer.mail_options, function(error, info) {
    if(error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
}
// --------------------------------------------------------------------------------------
