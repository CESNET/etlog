var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var database = require( './db' );
var fs = require( 'fs' );

// -----------------------------------------------------------
// routes
var index = require('./routes/index');
var angular_test = require('./routes/angular_test');
var users = require('./routes/users');
var mac = require('./routes/mac');
var roaming = require('./routes/roaming');
var inst_roaming= require('./routes/inst_roaming');
var failed_logins = require('./routes/failed_logins');
var search = require('./routes/search');
var failed_logins_search = require('./routes/failed_logins_search');

// -----------------------------------------------------------
// passport
var passport = require('passport');
// passport-saml
var SamlStrategy = require('passport-saml').Strategy;

// saml_test
var saml_test = require('./routes/saml_test');


// callback
var callback = require('./routes/callback');

var app = express();


// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req, res, next){
  req.db = database;
  next();
});

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



app.post('/login/callback',
  //passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  passport.authenticate('saml', { failureRedirect: '/test', failureFlash: true }),       // TODO
  function(req, res) {
    res.redirect('/');
  }
);


app.get('/login',
  passport.authenticate('saml', { failureRedirect: '/test', failureFlash: true }),      // TODO
  function(req, res) {
    res.redirect('/');
  }
);

//
//app.use('/SSOLogin', sso);
// -----------------------------------------------------------

// debug routovani
//console.log(app._router.stack);

// -----------------------------------------------------------

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// -----------------------------------------------------------

var pvk = fs.readFileSync('/etc/shibboleth/sp-key.pem', 'utf-8');
var cert = fs.readFileSync('/etc/shibboleth/sp-cert.pem', 'utf-8');
var idpcert = fs.readFileSync('/etc/shibboleth/idp-cert.pem', 'utf-8');

console.log("debug");
console.log(cert);

var str = new SamlStrategy(
  {
    //callbackUrl: 'http:radlog.cesnet.cz:3000/login/callback',
    //entryPoint: 'https://idp2.civ.cvut.cz/idp/profile/SAML2/Redirect/SSO',
    //issuer: 'https://idp2.civ.cvut.cz/idp/shibboleth',

    callbackUrl: 'http://radlog.cesnet.cz:3000/login/callback',
    entryPoint: 'https://whoami-dev.cesnet.cz/idp/profile/SAML2/Redirect/SSO',
    issuer: 'https://radlog.cesnet.cz/',
    protocol: 'https://',
    
    // zatim nechat byt
    decryptionPvk: pvk,
    //privateCert: cert,
    
    identifierFormat : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    
    cert: idpcert
    //privateCert: ''


    //additionalParams:{'RelayState': '/'}        // ?

  },
  function(profile, done) {         // TODO
    console.log("autentizace OK");

    // tady je treba se dostat k obsahu assertion - informace o prihlasenem uzivateli
    console.log(profile);
    console.log(profile.getAssertionXml());
    console.log("");
    console.log("");
    console.log("");
    console.log("");
    console.log(done());

    //render("OK")
    //findByEmail(profile.email, function(err, user) {
    //  if (err) {
    //    return done(err);
    //  }
    //  return done(null, user);
    });
  //})


passport.use(str);
console.log(str.generateServiceProviderMetadata(cert));

console.log("metadata");
//console.log(passport.generateServiceProviderMetadata);
//passport.generateServiceProviderMetadata();


// -----------------------------------------------------------

module.exports = app;
