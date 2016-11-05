module.exports = function(app) {
// --------------------------------------------------------------------------------------
const mail = require( './mail' );
// --------------------------------------------------------------------------------------
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Stránka nenalezena');
    err.status = 404;
    next(err);
  });
// --------------------------------------------------------------------------------------
// error handlers
// --------------------------------------------------------------------------------------
  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
      if(err.status != 404)         // do not log 404
        console.error(err);         // log error to console

      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }
// --------------------------------------------------------------------------------------
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
     
    var msg = err.message;

    if(err.status == undefined) {       // server failure
      msg = "V aplikaci došlo k chybě. Hlášení o chybě bylo odesláno vývojářům.";
      mail.send_error_report(err);    // send error report to developers
      res.end(msg);
    }
    else if(err.status == 404) {
      res.render('error', {
        message: err.message,
        error: {}
      });
    }
    else {
      res.end(msg);
    }
  });
// --------------------------------------------------------------------------------------
}
// --------------------------------------------------------------------------------------
