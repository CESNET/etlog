module.exports = function(app) {
  // set up routes
  app.use('/', require('./routes/index'));
  app.use('/angular_test', require('./routes/angular_test'));
  app.use('/search', require('./routes/search'));
  app.use('/mac', require('./routes/mac'));
  app.use('/roaming', require('./routes/roaming'));
  app.use('/inst_roaming', require('./routes/inst_roaming'));
  app.use('/failed_logins', require('./routes/failed_logins'));
  app.use('/failed_logins_search', require('./routes/failed_logins_search'));

  // saml test
  app.use('/test', require('./routes/saml_test'));
  app.use('/login/callback', require('./routes/callback'));
}
