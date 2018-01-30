var Acquit = require('acquit');

var defaultOptions = {
  start: '// acquit:ignore:start',
  end: '// acquit:ignore:end'
};

module.exports = function(parser, options) {
  if (!parser) {
    parser = Acquit;
  } else if (!(parser instanceof Acquit)) {
    options = parser;
    parser = Acquit;
  }

  options = options || {};
  if (!options.start) {
    options.start = defaultOptions.start;
  }
  if (!options.end) {
    options.end = defaultOptions.end;
  }

  var regexp = new RegExp('[\\s]+' + options.start + '[\\s\\S]*?' +
    options.end, 'g');

  parser.transform(function(block) {
    block.code = block.code.replace(regexp, '');
  });
};
