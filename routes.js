module.exports = function(app) {
  // set up routes
  app.use('/', require('./routes/index'));                                              // empty title page
  app.use('/angular_test', require('./routes/angular_test'));                           // angular test page
  app.use('/search', require('./routes/search'));                                       // generic search
  app.use('/search/mac_count', require('./routes/mac_count'));                          // generic mac address count search
  app.use('/search/roaming/most_provided', require('./routes/roaming_most_provided'));  // generic search of institutions most providing roaming
  app.use('/search/roaming/most_used', require('./routes/roaming_most_used'));          // generic search of institutions most using roaming
  app.use('/search/failed_logins', require('./routes/failed_logins'));                  // TODO
  app.use('/search/failed_logins_search', require('./routes/failed_logins_search'));    // TODO

  // TODO
  //app.use('/search/mac_identifier', require('./routes/mac_identifier'));              // TODO
  //app.use('/search/lost_devices', require('./routes/lost_device'));              // TODO

  // TODO
  // app.use('/stats', require('./routes/stats'));   // TODO

  // saml test
  app.use('/auth_fail', require('./routes/auth_fail'));
  app.use('/login/callback', require('./routes/callback'));
}
