var vows = require('vows');
var assert = require('assert');
var util = require('util');
var Strategy = require('passport-ip/strategy');
var BadRequestError = require('passport-ip/errors/badrequesterror');


vows.describe('ipStrategy').addBatch({

  'strategy': {
    topic: function() {
      return new Strategy({range:'1.1.1.1'}, function(){});
    },

    'should be named session': function (strategy) {
      assert.equal(strategy.name, 'ip');
    },
  },

  'strategy handling a request in range': {
    topic: function() {
      var strategy = new Strategy({range:'1.1.1.1/5'}, function(){});

      //Mock
      strategy.redirect = function(url) {
          assert.equal(url, '/login/callback?code=dummy');
          strategy.authenticate( {
                                  query: { code: 'dummy' },
                                  ip: '1.1.1.1'
                                 });
      };

      return strategy;
    },

    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {
          query: {},
        };

        strategy.success = function(user) {
          self.callback(null, user);
        };

        strategy.fail = function() {
          self.callback(new Error('should-not-be-called'));
        };

        strategy._verify = function(client, done) {
          done(null, { user_id: client.id });
        };

        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },

      'should not generate an error' : function(err, user) {
        assert.isNull(err);
      },
      'should authenticate' : function(err, user) {
        assert.equal(user.user_id, '1.1.1.1');
      },
    },
  },

  'strategy handling a request in multiple ranges': {
    topic: function() {
      var strategy = new Strategy({
        range: ['1.1.1.1/5' , '10.0.0.0/10']
      }, function(err, profile, done) {

      });

      //Mock
      strategy.redirect = function(url) {
        assert.equal(url, '/login/callback?code=dummy');
        strategy.authenticate({ query: { code: 'dummy' }, ip: '1.1.1.1' });
        return strategy;
      };

      return strategy;
    },

    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};

        strategy.success = function(user) {
          self.callback(null, user);
        };

        strategy.fail = function() {
          throw new Error('should-not-be-called');
        };

        strategy._verify = function(client, done) {
          done(null, { user_id: client.id });
        };

        process.nextTick(function () {
          strategy.authenticate(req);
        });

      },

      'should not generate an error' : function(err, user) {
        assert.isNull(err);
      },
      'should authenticate' : function(err, user) {
        assert.equal(user.user_id, '1.1.1.1');
      },
    },
  },

  'strategy handling a request in multiple ranges with an optional username': {
    topic: function() {
      var strategy = new Strategy({
        range: ['1.1.1.1/5', '10.0.0.0/10'],
        username: '123'
      }, function(){});

      //Mock
      strategy.redirect = function(url) {
        assert.equal(url, '/login/callback?code=dummy');
        strategy.authenticate({
                                query: { code: 'dummy' },
                                ip: '1.1.1.1'
                               });

        return strategy;
      };

      return strategy;
    },

    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};

        strategy.success = function(user) {
          self.callback(null, user);
        };

        strategy.fail = function() {
          self.callback(new Error('should-not-be-called'));
        };

        strategy._verify = function(client, done) {
          done(null, { user_id: client.id, username: client.username });
        };

        req.ip = '1.1.1.1';

        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },

      'should not generate an error' : function(err, user) {
        assert.isNull(err);
      },
      'should authenticate' : function(err, user) {
        assert.equal(user.user_id, '1.1.1.1');
        assert.equal(user.username, '123');
      },
    },
  },

  'strategy handling a request off range fails': {
    topic: function() {
      var strategy = new Strategy({range:'1.1.1.1/5'}, function(){});

      strategy.redirect = function(url) {
          assert.equal(url, '/login/callback?code=dummy');
          strategy.authenticate( {
                                  query: { code: 'dummy' },
                                  ip: '192.168.1.6'
                                 });
      };

      return strategy;
    },

    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};
        strategy.success = function(user) {
          self.callback(new Error('should-not-be-called'));
        };
        strategy.fail = function() {
          self.callback(null);
        };

        strategy._verify = function(client, done) {
          self.callback(new Error('should-not-be-called'));
        };

        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },

      'should not generate an error' : function(err, user) {
        assert.isNull(err);
      },
      'should authenticate' : function(err, user) {

      },
    },
  },

  'strategy handling a request that encounters an error during verification': {
    topic: function() {
      var strategy = new Strategy({range: '1.1.1.1/2'}, function(){});

      strategy.redirect = function(url) {
          assert.equal(url, '/login/callback?code=dummy');
          strategy.authenticate( {
                                  query: { code: 'dummy' },
                                  ip: '1.1.1.1'
                                 });
        return strategy;
      };

      return strategy;
    },

    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};
        strategy.success = function(user) {
          self.callback(new Error('should-not-be-called'));
        };
        strategy.fail = function() {
          self.callback(new Error('should-not-be-called'));
        };
        strategy.error = function(err) {
          self.callback(null, err);
        };

        strategy._verify = function(client, done) {
          done(new Error('something-went-wrong'));
        };

        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },

      'should not call success or fail' : function(err, e) {
        assert.isNull(err);
      },
      'should call error' : function(err, e) {
        assert.instanceOf(e, Error);
      },
    },
  },

  'strategy handling a request with no IP address': {
    topic: function() {
      var strategy = new Strategy({range:'1.1.1.1/2'}, function(){});

      strategy.redirect = function(url) {
        assert.equal(url, '/login/callback?code=dummy');
        strategy.authenticate( { query: { code: 'dummy' } });
        return strategy;
      };

      return strategy;
    },

    'after augmenting with actions': {
      topic: function(strategy) {
        var self = this;
        var req = {};
        strategy.fail = function(info) {
          self.callback(null, info);
        };

        req.headers =  {} ;
        process.nextTick(function () {
          strategy.authenticate(req);
        });
      },

      'should fail authentication' : function(err) {
        // fail action was called, resulting in test callback
        assert.isTrue(true);
      },
      'should pass BadReqestError as additional info' : function(err, info) {
        assert.instanceOf(info, Error);
        assert.instanceOf(info, BadRequestError);
      },
    },
  },

  'strategy constructed without a verify callback': {
    'should throw an error': function (strategy) {
      assert.throws(function() { new Strategy() });
    },
  },

  'strategy constructed without a range': {
    'should throw an error': function (strategy) {
      assert.throws(function() { new Strategy({something_else:'whatever'}, function(){}) });
    },
  },
}).export(module);
