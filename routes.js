module.exports = function(app, database) {
// -----------------------------------------------------------
  // TODO
  // prepend authentication to all routes
 
  // TODO
  // use permissions - [ user, administrator ]
  //
  // all routes may be used by administrator
  //
  // only specific routes may be used by user

  // set up routes
// -----------------------------------------------------------
  app.use('/', require('./routes/index'));                                       // title page
  app.use('/api/search', require('./routes/search'));                                // generic search api
  app.use('/api/mac_count', require('./routes/mac_count'));                          // generic api for mac address count
  app.use('/api/roaming/most_provided', require('./routes/roaming_most_provided'));  // generic api for institutions most providing roaming
  app.use('/api/roaming/most_used', require('./routes/roaming_most_used'));          // generic api for institutions most using roaming
  app.use('/api/failed_logins', require('./routes/failed_logins'));                  // generic api for failed logins
  app.use('/api/shared_mac', require('./routes/shared_mac'));                        // generic api for shared mac
  // TODO
  //app.use('/api/mac_identifier', require('./routes/mac_identifier'));              // TODO
  //app.use('/api/lost_devices', require('./routes/lost_device'));              // TODO
  // app.use('/api/stats', require('./routes/stats'));   // TODO


// -----------------------------------------------------------
  // login routing is defined separately
  // see auth.js
  // TODO
  // metadata url

  // saml test
  app.use('/auth_fail', require('./routes/auth_fail'));
  //app.use('/login/callback', require('./routes/callback'));
}
