module.exports = function(app) {
  // set up routes
  app.use('/', require('./routes/index'));                      // empty title page
  app.use('/angular_test', require('./routes/angular_test'));   // angular test page
  app.use('/search', require('./routes/search'));               // generic search
  app.use('/mac', require('./routes/mac'));                     // generic mac address search
  app.use('/roaming', require('./routes/roaming'));             // roaming 1 // TODO
  app.use('/inst_roaming', require('./routes/inst_roaming'));   // roaming 2 // TODO
  app.use('/failed_logins', require('./routes/failed_logins')); // TODO
  app.use('/failed_logins_search', require('./routes/failed_logins_search'));   // TODO

  // saml test
  app.use('/test', require('./routes/saml_test'));
  app.use('/login/callback', require('./routes/callback'));
}
