const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const database = require( './db' );
const fs = require( 'fs' );

// -----------------------------------------------------------
// call express
var app = express();

// -----------------------------------------------------------
// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// -----------------------------------------------------------
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const saml = require('./auth')(app, database);          // SAML + IP based auth

// -----------------------------------------------------------
// Make our db accessible to our router
app.use(function(req, res, next){
  req.db = database;
  next();
});

// -----------------------------------------------------------

// set up routes
require('./routes')(app, database);


// -----------------------------------------------------------
// set up cron tasks
require('./cron')(database);  // TODO


// TODO - http://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line

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
    console.error(err);         // log error to console
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

module.exports = app;
