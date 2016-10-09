module.exports = function(app, database) {
// -----------------------------------------------------------
  // TODO
  // prepend authentication to all routes
 
  // set up routes
// -----------------------------------------------------------
  app.use('/', require('./routes/index'));                                       // empty title page
  app.use('/angular_test', require('./routes/angular_test'));                    // angular test page
  app.use('/search', require('./routes/search'));                                // generic search api
  app.use('/mac_count', require('./routes/mac_count'));                          // generic api for mac address count
  app.use('/roaming/most_provided', require('./routes/roaming_most_provided'));  // generic api for institutions most providing roaming
  app.use('/roaming/most_used', require('./routes/roaming_most_used'));          // generic api for institutions most using roaming
  app.use('/invalid_records', require('./routes/invalid_records'));              // api for invalid records
  app.use('/failed_logins', require('./routes/failed_logins'));                  // generic api for failed logins
  // TODO
  //app.use('/mac_identifier', require('./routes/mac_identifier'));              // TODO
  //app.use('/lost_devices', require('./routes/lost_device'));              // TODO
  // app.use('/stats', require('./routes/stats'));   // TODO


// -----------------------------------------------------------
  // login routing is defined separately
  // see auth.js
  // TODO
  // metadata url

  // saml test
  app.use('/auth_fail', require('./routes/auth_fail'));
  //app.use('/login/callback', require('./routes/callback'));
}
