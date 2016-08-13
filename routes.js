module.exports = function(app) {

  // require individual files
  var index = require('./routes/index');
  var angular_test = require('./routes/angular_test');
  var users = require('./routes/users');
  var mac = require('./routes/mac');
  var roaming = require('./routes/roaming');
  var inst_roaming= require('./routes/inst_roaming');
  var failed_logins = require('./routes/failed_logins');
  var search = require('./routes/search');
  var failed_logins_search = require('./routes/failed_logins_search');

  // saml_test
  var saml_test = require('./routes/saml_test');


  // callback
  var callback = require('./routes/callback');

  // set up routes
  app.use('/', index);
  app.use('/angular_test', angular_test);
  //app.use('/users', users);
  //app.use('/mac', mac);
  //app.use('/results', results);
  app.use('/search', search);
  app.use('/mac', mac);
  app.use('/roaming', roaming);
  app.use('/inst_roaming', inst_roaming);
  app.use('/failed_logins', failed_logins);
  app.use('/failed_logins_search', failed_logins_search);

  // saml test
  //app.use('/login/callback', saml_test);
  app.use('/test', saml_test);
  app.use('/login/callback', callback);
}
