const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const database = require( './db' );
const fs = require( 'fs' );
// --------------------------------------------------------------------------------------
// call express
var app = express();

// connect to the database
database.connect();

// --------------------------------------------------------------------------------------
// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// --------------------------------------------------------------------------------------
// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
// Standard Apache combined log output with added response time and status
app.use(logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time[3] ms :status'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const saml = require('./auth')(app, database);          // SAML + IP based auth

// --------------------------------------------------------------------------------------
// Make our db accessible to our router
app.use(function(req, res, next){
  req.db = database;
  next();
});

// --------------------------------------------------------------------------------------

// set up routes
require('./routes')(app, database);


// --------------------------------------------------------------------------------------
// set up cron tasks
require('./cron')(database);

// --------------------------------------------------------------------------------------

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

// --------------------------------------------------------------------------------------
module.exports = app;
