'use strict'

module.exports = function (input, opts) {
  opts = opts || {}

  if (!Array.isArray(input) || input.length !== 2 || !Number.isFinite(input[0]) || !Number.isFinite(input[1])) {
    return false
  }

  return opts.validate ? input[0] >= -180 && input[0] <= 180 && input[1] >= -90 && input[1] <= 90 : true
}
