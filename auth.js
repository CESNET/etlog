module.exports = function(app) {
// -----------------------------------------------------------
  var fs = require( 'fs' );
  // passport
  var passport = require('passport');
  // passport-saml
  var SamlStrategy = require('passport-saml').Strategy;

// -----------------------------------------------------------

  app.use(passport.initialize());

// -----------------------------------------------------------

  app.get('/login',
    passport.authenticate(['ip', 'saml'], { failureRedirect: '/auth_fail'}),      // TODO
    function(req, res) {
      // If this function gets called, authentication was successful.
      //console.log("req: ");     // TODO
      //console.log(req);
      //console.log("res: ");
      //console.log(res);
      console.log("auth successful");
      res.redirect('/');
    }
  );

// -----------------------------------------------------------

  var pvk = fs.readFileSync('cert/etlog.cesnet.cz.key.pem', 'utf-8');
  var cert = fs.readFileSync('cert/etlog.cesnet.cz.crt.pem', 'utf-8');
  var idpcert = fs.readFileSync('cert/idp-cert.pem', 'utf-8');

  //console.log("debug");
  //console.log(cert);

  var str = new SamlStrategy({
      //entryPoint: 'https://idp2.civ.cvut.cz/idp/profile/SAML2/Redirect/SSO',
      //issuer: 'https://idp2.civ.cvut.cz/idp/shibboleth',

      callbackUrl: 'https://etlog.cesnet.cz/login/callback',
      entryPoint: 'https://whoami-dev.cesnet.cz/idp/profile/SAML2/Redirect/SSO',
      issuer: 'https://etlog.cesnet.cz/',
      protocol: 'https://',
      
      // zatim nechat byt
      decryptionPvk: pvk,
      //privateCert: cert,
      
      identifierFormat : 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
      
      cert: idpcert
      //privateCert: ''
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


  passport.use(str);
  console.log(str.generateServiceProviderMetadata(cert));

// -----------------------------------------------------------

  var IpStrategy = require('passport-ip').Strategy;

  passport.use(new IpStrategy({
    //range: '10.0.0.0/8'
    //range: '147.32.120.111/32'
    range: '::ffff:147.32.120.111/32'
    //range: '2001:718:2:1::146/128'
    //range: '::ffff:147.32.120.111/32'
  }, function(profile, done){
    console.log("profile");
    console.log(profile);
    console.log("done");
    console.log(done);
    done(null, profile);
    //profile.id is the ip address.
  }));



  //http://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize

  passport.serializeUser(function(user, done) {   //  TODO
        done(null, user);
  });

  passport.deserializeUser(function(user, done) { // TODO
        done(null, user);
  });


// -----------------------------------------------------------
}
