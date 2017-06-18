module.exports = function(app, database) {
// -----------------------------------------------------------
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
  app.use('/api/concurrent_users', require('./routes/concurrent_users'));            // generic api for concurrent users
  app.use('/api/concurrent_inst', require('./routes/concurrent_inst'));              // api for concurrent institutions
  app.use('/api/concurrent_rev', require('./routes/concurrent_rev'));                // api for concurrent revisions
  app.use('/api/user', require('./routes/user'));                                    // api for user managament
// -----------------------------------------------------------
}
