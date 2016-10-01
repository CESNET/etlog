'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = function () {
  var rawQuery = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var result = {};
  var query = typeof rawQuery === 'string' ? _querystring2.default.parse(rawQuery) : rawQuery;

  options.blacklist = options.blacklist || [];

  operators.forEach(function (_ref5) {
    var operator = _ref5.operator;
    var method = _ref5.method;
    var defaultKey = _ref5.defaultKey;

    var key = options[operator + 'Key'] || defaultKey;
    var value = query[key];
    options.blacklist.push(key);

    if (value || operator === 'filter') {
      result[operator] = method(value, query, options);
    }
  });

  return result;
};

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function castValue(type, value) {
  if (type === 'string') {
    return String(value);
  } else if (type === 'date') {
    return new Date(String(value));
  }
}

function parseValue(rawValue) {
  var value = rawValue.trim();

  if (value.includes(',')) {
    return value.split(',').map(parseValue);
  }

  // Match type casting operators like string(true)
  var casting = value.match(/^(string|date)\((.*)\)$/);
  if (casting) {
    return castValue(casting[1], casting[2]);
  }

  // Match regex operators like /foo_\d+/i
  var regex = value.match(/^\/(.*)\/(i?)$/);
  if (regex) {
    return new RegExp(regex[1], regex[2]);
  }

  // Match boolean values
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  // Match null
  if (value === 'null') {
    return null;
  }

  // Match numbers (string padded with zeros are not numbers)
  if (!isNaN(Number(value)) && !/^0[0-9]+/.test(value)) {
    return Number(value);
  }

  // Match YYYY-MM-DDTHH:mm:ssZ format dates
  /* eslint-disable max-len */
  var date = value.match(/[12]\d{3}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)(T| )?(([01][0-9]|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?/);
  /* eslint-enable max-len */
  if (date) {
    return new Date(value);
  }

  return value;
}

function parseOperator(operator) {
  if (operator === '=') {
    return '$eq';
  } else if (operator === '!=') {
    return '$ne';
  } else if (operator === '>') {
    return '$gt';
  } else if (operator === '>=') {
    return '$gte';
  } else if (operator === '<') {
    return '$lt';
  } else if (operator === '<=') {
    return '$lte';
  } else if (!operator) {
    return '$exists';
  }
}

/**
 * Map/reduce helper to transform list of unaries
 * like '+a,-b,c' to {a: 1, b: -1, c: 1}
 */
function parseUnaries(unaries) {
  var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { plus: 1, minus: -1 };

  var unariesAsArray = typeof unaries === 'string' ? unaries.split(',') : unaries;

  return unariesAsArray.map(function (x) {
    return x.match(/^(\+|-)?(.*)/);
  }).reduce(function (result, _ref) {
    var _ref2 = _slicedToArray(_ref, 3);

    var val = _ref2[1];
    var key = _ref2[2];

    result[key.trim()] = val === '-' ? values.minus : values.plus;
    return result;
  }, {});
}

function getProjection(projection) {
  var fields = parseUnaries(projection, { plus: 1, minus: 0 });

  /*
    From the MongoDB documentation:
    "A projection cannot contain both include and exclude specifications,
    except for the exclusion of the _id field."
  */
  var hasMixedValues = Object.keys(fields).reduce(function (set, key) {
    if (key !== '_id') {
      set.add(fields[key]);
    }
    return set;
  }, new Set()).size > 1;

  if (hasMixedValues) {
    Object.keys(fields).forEach(function (key) {
      if (fields[key] === 1) {
        delete fields[key];
      }
    });
  }

  return fields;
}

function getSort(sort) {
  return parseUnaries(sort);
}

function getSkip(skip) {
  return Number(skip);
}

function getLimit(limit) {
  return Number(limit);
}

function getFilter(filter, query, options) {
  if (filter) {
    try {
      return JSON.parse(filter);
    } catch (err) {
      throw new Error('Invalid JSON string: ' + filter);
    }
  }

  return Object.keys(query).map(function (val) {
    var join = query[val] ? val + '=' + query[val] : val;
    // Separate key, operators and value

    var _join$match = join.match(/(!?)([^><!=]+)([><]=?|!?=|)(.*)/);

    var _join$match2 = _slicedToArray(_join$match, 5);

    var prefix = _join$match2[1];
    var key = _join$match2[2];
    var op = _join$match2[3];
    var value = _join$match2[4];

    return { prefix: prefix, key: key, op: parseOperator(op), value: parseValue(value) };
  }).filter(function (_ref3) {
    var key = _ref3.key;
    return options.blacklist.indexOf(key) === -1 && (!options.whitelist || options.whitelist.indexOf(key) !== -1);
  }).reduce(function (result, _ref4) {
    var prefix = _ref4.prefix;
    var key = _ref4.key;
    var op = _ref4.op;
    var value = _ref4.value;

    if (!result[key]) {
      result[key] = {};
    }

    if (Array.isArray(value)) {
      result[key][op === '$ne' ? '$nin' : '$in'] = value;
    } else if (op === '$exists') {
      result[key][op] = prefix !== '!';
    } else if (op === '$eq') {
      result[key] = value;
    } else if (op === '$ne' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
      result[key].$not = value;
    } else {
      result[key][op] = value;
    }

    return result;
  }, {});
}

var operators = [{ operator: 'projection', method: getProjection, defaultKey: 'fields' }, { operator: 'sort', method: getSort, defaultKey: 'sort' }, { operator: 'skip', method: getSkip, defaultKey: 'skip' }, { operator: 'limit', method: getLimit, defaultKey: 'limit' }, { operator: 'filter', method: getFilter, defaultKey: 'filter' }];