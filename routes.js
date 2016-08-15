module.exports = function(app) {
  // set up routes
  app.use('/', require('./routes/index'));                                              // empty title page
  app.use('/angular_test', require('./routes/angular_test'));                           // angular test page
  app.use('/search/generic', require('./routes/search'));                               // generic search
  app.use('/search/mac', require('./routes/mac'));                                      // generic mac address count > 2 search
  app.use('/search/roaming/most_provided', require('./routes/roaming_most_provided'));  // generic search of institutions most providing roaming
  app.use('/search/roaming/most_used', require('./routes/roaming_most_used'));          // generic search of institutions most using roaming
  app.use('/search/failed_logins', require('./routes/failed_logins'));                  // TODO
  app.use('/search/failed_logins_search', require('./routes/failed_logins_search'));    // TODO

  // TODO
  // app.use('/stats', require('./routes/stats'));   // TODO

  // saml test
  app.use('/test', require('./routes/saml_test'));
  app.use('/login/callback', require('./routes/callback'));
}
