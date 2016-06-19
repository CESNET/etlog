var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var database = require( './db' );
var fs = require( 'fs' );

// routes
var index = require('./routes/index');
var users = require('./routes/users');
var mac = require('./routes/mac');
var results = require('./routes/results');
var roaming = require('./routes/roaming');
var search = require('./routes/search');
// -----------------------------------------------------------
// passport
var passport = require('passport');
// passport-saml
var SamlStrategy = require('passport-saml').Strategy;

// saml_test
var saml_test = require('./routes/saml_test');


// callback
var callback = require('./routes/callback');

// sso
//var sso = require('./routes/sso');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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
//app.use('/users', users);
//app.use('/mac', mac);
//app.use('/results', results);
//app.use('/roaming', roaming);
app.use('/search', search);

// saml test
//app.use('/login/callback', saml_test);
app.use('/test', saml_test);
app.use('/login/callback', callback);



//app.get('/SSOLogin',
//passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
//function(req, res) {
//  res.redirect('/');
//}
//);

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
    //path: '/login/callback',
    entryPoint: 'https://whoami-dev.cesnet.cz/idp/profile/SAML2/Redirect/SSO',
    issuer: 'https://radlog.cesnet.cz/',
    protocol: 'https://',
    //generateServiceProviderMetadata: '/test',
    //cert: 'MIIFSDCCBDCgAwIBAgIQBXyYdVS7UxZI1dayu2ZXbDANBgkqhkiG9w0BAQsFADBkMQswCQYDVQQGEwJOTDEWMBQGA1UECBMNTm9vcmQtSG9sbGFuZDESMBAGA1UEBxMJQW1zdGVyZGFtMQ8wDQYDVQQKEwZURVJFTkExGDAWBgNVBAMTD1RFUkVOQSBTU0wgQ0EgMzAeFw0xNTExMTMwMDAwMDBaFw0xODExMjExMjAwMDBaMIGOMQswCQYDVQQGEwJDWjEdMBsGA1UECAwUSGxhdm7DrSBtxJtzdG8gUHJhaGExEDAOBgNVBAcTB1ByYWhhIDYxMzAxBgNVBAoMKsSMZXNrw6kgdnlzb2vDqSB1xI1lbsOtIHRlY2huaWNrw6kgdiBQcmF6ZTEZMBcGA1UEAxMQaWRwMi5jaXYuY3Z1dC5jejCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKFi5O/MIGOQ7k41iOHwDzkOIJL/0F5TZyR6sTBSLWTOlTo5JIeaWj4vcL6Vww6kbnV9uQci/8eEOSrnI9DHrfA59vjgcH67PE1EzEhgCaCfrcNT1RnLBsb0OgyXay9sfr/Ylq0UORDTyPNSp8zDOPpwzvcz5dmfQ4uOOP1R6H5h1BPJ0MlRaTtnuIaNQ71nUHmy0UWQc2dJTqf0xEXUSzbr28LD9TlaJjm9oPdnwPxPGUvc5YjxAe5ElH179C/rIkxaz0313LwOrYWEdNn0KNJ6mRkD4Xcj0MiJVD201Gjw6nSWnXLvfqOPxpv+vfKpnGnAUzBaMySV0spSVkU/iUECAwEAAaOCAckwggHFMB8GA1UdIwQYMBaAFGf9iCAUJ5jHCdIlGbvpURFjdVBiMB0GA1UdDgQWBBQ5zJX+DRBUzFYzzJTV7wxCcFZTOTAbBgNVHREEFDASghBpZHAyLmNpdi5jdnV0LmN6MA4GA1UdDwEB/wQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwawYDVR0fBGQwYjAvoC2gK4YpaHR0cDovL2NybDMuZGlnaWNlcnQuY29tL1RFUkVOQVNTTENBMy5jcmwwL6AtoCuGKWh0dHA6Ly9jcmw0LmRpZ2ljZXJ0LmNvbS9URVJFTkFTU0xDQTMuY3JsMEwGA1UdIARFMEMwNwYJYIZIAYb9bAEBMCowKAYIKwYBBQUHAgEWHGh0dHBzOi8vd3d3LmRpZ2ljZXJ0LmNvbS9DUFMwCAYGZ4EMAQICMG4GCCsGAQUFBwEBBGIwYDAkBggrBgEFBQcwAYYYaHR0cDovL29jc3AuZGlnaWNlcnQuY29tMDgGCCsGAQUFBzAChixodHRwOi8vY2FjZXJ0cy5kaWdpY2VydC5jb20vVEVSRU5BU1NMQ0EzLmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQAEdk6PHL6Vy1eHvc76Rvsdf1eeZYgQhC83Mu3Jl7YdJ3Gn0e9/Ae2uFUI3ojr0OUEqyLNyQyeDENJQ0bmn8N10sXxSSx4kTXe+FXjpCk/voBuAwIkm1e00/xmgfWLq40FVmZTeA4+h8NYs+ZVSDvLlBnsSj9urq61ARMT3jGlNeTzC0V+6CE9SizLKMJ1c5/jNzGM0V9zEp+fa293vqzGiIWE+Jk982d31nGCZR1WdrPcjGd2s3oEPc09v+pn5TTdHEeo+ANYmEJCunBeqEsRfmPxWNVpqZB+YKKqbDRGVQpSJUN8ck7lFolqJBnncLaNXBJP3EL3PvAXtdbMpcuHB',       // certifikat idp2.civ.cvut.cz
    
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
