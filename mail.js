var nodemailer = require('nodemailer');
// -----------------------------------------------------------
var transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  requireTLS : false,
  ignoreTLS : true
});
// -----------------------------------------------------------
// setup e-mail data with unicode symbols
var mailOptions = {
  from: 'etlog <etlog@etlog.cesnet.cz>', // sender address
  //to: 'jan.tomasek@cesnet.cz', // list of receivers TODO
  to: 'vac.mach@sh.cvut.cz',  // copy 
  //cc: 'vac.mach@sh.cvut.cz',  // copy     // TODO set this as production
  subject: 'test', // Subject line      // TODO
  //text: '' // plaintext body        // TODO
  text: 'testovaci email' // plaintext body        // TODO
};
// -----------------------------------------------------------
// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info) {
  if(error) {
    return console.log(error);
  }

  console.log('Message sent: ' + info.response);
});
// -----------------------------------------------------------
//module.exports = // TODO
// -----------------------------------------------------------
