'use strict'

var isArray = require('lodash.isarray')
var isNumber = require('lodash.isnumber')

module.exports = function (input, opts) {
  opts = opts || {}

  if (!isArray(input) || input.length !== 2 || !isNumber(input[0]) || !isNumber(input[1])) {
    return false
  }

  return opts.validate ? input[0] >= -180 && input[0] <= 180 && input[1] >= -90 && input[1] <= 90 : true
}
