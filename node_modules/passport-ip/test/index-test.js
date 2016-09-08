var vows = require('vows');
var assert = require('assert');
var util = require('util');
var ip = require('passport-ip');

vows.describe('passport-ip').addBatch({

  'module': {
    'should report a version': function (x) {
      assert.isString(ip.version);
    },

    'should export BadRequestError': function (x) {
      assert.isFunction(ip.BadRequestError);
    },
  },

}).export(module);
