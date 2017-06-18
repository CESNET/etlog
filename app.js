const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const database = require( './db' );
const fs = require( 'fs' );
const rotator = require('file-stream-rotator')
const secrets = require('./config/secrets')
// --------------------------------------------------------------------------------------
// call express
var app = express();

// connect to the database
database.connect();

// init session
app.set('trust proxy', 1)       // app is behind a proxy
app.use(session({ secret : secrets.session,
                  secure : true,
                  resave : false,
                  saveUninitialized : false,
                  store : new MongoStore({ db : 'SessionStore', url : 'mongodb://localhost:27017/etlog' }),
                }));

// --------------------------------------------------------------------------------------
// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// --------------------------------------------------------------------------------------
// set up webserver log files

var log_dir = '/home/etlog/logs/access/';

// ensure log directory exists
fs.existsSync(log_dir) || fs.mkdirSync(log_dir);

// create a rotating write stream
var access_log = rotator.getStream({
  date_format: 'YYYY-MM-DD',
  filename: path.join(log_dir, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

// --------------------------------------------------------------------------------------
// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
// custom logging
logger.token('user_role', function (req, res) {
  if(req.session && req.session.user && req.session.user.role)
    return req.session.user.role;
  else
    return "";
});

// Standard Apache combined log output with added response time and status
// output to access log
app.use(logger(':remote-addr - :req[remote_user] ":user_role" [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time[3] ms :status', { stream : access_log }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
// set up middleware error handling
require('./error_handling')(app);

// --------------------------------------------------------------------------------------
module.exports = app;
