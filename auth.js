module.exports = function(app, database) {
// -----------------------------------------------------------
  var fs = require( 'fs' );
  // passport
  var passport = require('passport');
  // passport-saml
  var saml_strategy = require('passport-saml').Strategy;

// -----------------------------------------------------------
  // passport setup
  app.use(passport.initialize());

// -----------------------------------------------------------
  // routing
  app.get('/login',
    passport.authenticate(['ip', 'saml'], { failureRedirect: '/auth_fail', successRedirect: '/'})      // TODO
    //function(req, res) {
    //  // If this function gets called, authentication was successful.
    //  //console.log("req: ");     // TODO
    //  //console.log(req);
    //  //console.log("res: ");
    //  //console.log(res);
    //  console.log(req.user);
    //  console.log("auth successful");
    //  res.redirect('/');
    //}
  );
  // TODO - when is the defined strategy callback called ?


  // TODO - different failureRedirects on both routes ?

  app.post('/login/callback',
    //passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    passport.authenticate('saml', { failureRedirect: '/auth_fail' }),       // TODO
    function(req, res) {
      console.log("post login callback");
      res.redirect('/');
    }
  );

// -----------------------------------------------------------
  // saml

  var pvk = fs.readFileSync('cert/etlog.cesnet.cz.key.pem', 'utf-8');
  var cert = fs.readFileSync('cert/etlog.cesnet.cz.crt.pem', 'utf-8');
  var idpcert = fs.readFileSync('cert/idp-cert.pem', 'utf-8');

  var strategy = new saml_strategy({
      callbackUrl: 'https://etlog.cesnet.cz/login/callback',
      entryPoint: 'https://whoami-dev.cesnet.cz/idp/profile/SAML2/Redirect/SSO',
      issuer: 'https://etlog.cesnet.cz/',
      protocol: 'https://',
      decryptionPvk: pvk,
      //ecryptionCert: cert,
      identifierFormat : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
      cert: idpcert,
      //privateCert: cert
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


  passport.use(strategy);
  console.log(strategy.generateServiceProviderMetadata(cert));

// -----------------------------------------------------------
  // ip based authentication
  var db_ips = database.privileged_ips.find({}, { _id: 0 },     // search db for privileged ip addresses
  function(err, items) {
    var allowed_ips = [];

    for(var ip in items) {
      allowed_ips.push(items[ip]["ip"]);      // add to array
    }

// -----------------------------------------------------------

    var ip_strategy = require('passport-ip').Strategy;

    passport.use(new ip_strategy({
      range: allowed_ips          // use data from db
    }, function(profile, done){
      console.log("profile");
      console.log(profile);
      console.log("done");
      console.log(done);
      done(null, profile);
      //profile.id is the ip address.
    }));
  });

// -----------------------------------------------------------

  //http://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize

  passport.serializeUser(function(user, done) {   //  TODO
        done(null, user);
  });

  passport.deserializeUser(function(user, done) { // TODO
        done(null, user);
  });

// -----------------------------------------------------------
}
