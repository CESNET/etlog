// --------------------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const user = require('./user_common');
// --------------------------------------------------------------------------------------
// return basic info about user
// --------------------------------------------------------------------------------------
router.get('/info', function(req, res, next) {
  if(!req.session.user)
    req.session.user = user.get_user(req);
  respond(req.session.user, res);
});
// --------------------------------------------------------------------------------------
// change user role
// --------------------------------------------------------------------------------------
router.put('/set_role/:role', function(req, res, next) {
  req.session.user = user.set_user_role(req);
  respond(req.session.user, res);
});
// --------------------------------------------------------------------------------------
// return user permissions
// --------------------------------------------------------------------------------------
router.get('/permissions', function(req, res, next) {
  if(!req.session.user)
    req.session.user = user.get_user(req);

  get_permissions(req, res, respond);
});
// --------------------------------------------------------------------------------------
// return user notifications
// --------------------------------------------------------------------------------------
router.get('/notifications', function(req, res, next) {
  if(!req.session.user)
    req.session.user = user.get_user(req);

  get_notifications(req, res, respond);
});
// --------------------------------------------------------------------------------------
// update user notifications
// --------------------------------------------------------------------------------------
router.put('/notifications', function(req, res, next) {
  if(!req.session.user)
    req.session.user = user.get_user(req);

  update_notifications(req);
  respond(null, res);
});
// --------------------------------------------------------------------------------------
// update user notifications
// --------------------------------------------------------------------------------------
function update_notifications(req)
{
  var notifications = req.body;

  // search for realm admins locally in the database
  for(var item in notifications) {
    req.db.realm_admins.update({ "admin" : req.session.user.notify_address, "realm" : notifications[item].realm },
                               { $set : notifications[item] }, function(err1, items) {
      if(err1) {
        var err2 = new Error();      // just to detect where the original error happened
        console.error(err2);
        console.error(err1);
        next([err2, err1]);
        return;
      }
    });
  }
}
// --------------------------------------------------------------------------------------
// get list of notifications for user
// --------------------------------------------------------------------------------------
function get_notifications(req, res, respond)
{
  if(req.session.user.role != "realm_admin") {       // notifications allowed for realm admins only
    respond([], res);
    return;
  }

  // search for realm admins locally in the database
  req.db.realm_admins.find({ "admin" : req.session.user.notify_address }, { _id: 0, realm : 1, notify_enabled : 1 }, function(err1, items) {
    if(err1) {
      var err2 = new Error();      // just to detect where the original error happened
      console.error(err2);
      console.error(err1);
      next([err2, err1]);
      return;
    }

    respond(items, res);
  });
}
// --------------------------------------------------------------------------------------
// get list of permissions for user
// --------------------------------------------------------------------------------------
function get_permissions(req, res, respond)
{
  respond(req.session.user.groups, res);
}
// --------------------------------------------------------------------------------------
// send data to user
// --------------------------------------------------------------------------------------
function respond(items, res) {
  res.json(items);
}
// --------------------------------------------------------------------------------------
module.exports = router;
