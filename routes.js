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
  app.use('/', require('./routes/index'));                                           // title page
  app.use('/api/search', require('./routes/search'));                                // generic search api
  app.use('/api/mac_count', require('./routes/mac_count'));                          // generic api for mac address count
  app.use('/api/roaming/most_provided', require('./routes/roaming_most_provided'));  // generic api for institutions most providing roaming
  app.use('/api/roaming/most_used', require('./routes/roaming_most_used'));          // generic api for institutions most using roaming
  app.use('/api/failed_logins', require('./routes/failed_logins'));                  // generic api for failed logins
  app.use('/api/shared_mac', require('./routes/shared_mac'));                        // generic api for shared mac
  app.use('/api/heat_map', require('./routes/heat_map'));                            // generic api for heat map
  app.use('/api/db_data', require('./routes/db_data'));                              // api for db data
  app.use('/api/realms', require('./routes/realms'));                                // api for realms
  app.use('/api/count', require('./routes/count'));                                  // api to count records for pagination purposes
  app.use('/api/realm_logins', require('./routes/realm_logins'));                    // generic api for realm logins
  app.use('/api/visinst_logins', require('./routes/visinst_logins'));                // generic api for visinst logins
  app.use('/api/unique_users', require('./routes/unique_users'));                    // generic api for unique users

// -----------------------------------------------------------
  // login routing is defined separately
  // see auth.js

  // saml test
  app.use('/auth_fail', require('./routes/auth_fail'));
  //app.use('/login/callback', require('./routes/callback'));
}
