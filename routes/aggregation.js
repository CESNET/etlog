// --------------------------------------------------------------------------------------
// check if any of fileds is present in query
// if so, delete it and return as dict for
// further processing
// --------------------------------------------------------------------------------------
exp.check_filter = function(query, fields)
{
  var ret = {};

  for(var field in fields) {
    if(query[fields[field]]) {
      ret[fields[field]] = query[fields[field]];    // add to result
      delete query[fields[field]];                  // delete original item
    }
  }

  return ret;
}
// --------------------------------------------------------------------------------------
// add other operators, if defined in query
// --------------------------------------------------------------------------------------
exp.add_ops = function(aggregate_query, query)
{
  if(query.sort) {
    aggregate_query.push({ $sort : query.sort });   // sort
  }

  if(query.skip && query.limit) {   // both skip and limit
    aggregate_query.push({ $limit : query.limit + query.skip });   // limit to limit + skip
  }

  if(query.skip) {
    aggregate_query.push({ $skip : query.skip });   // skip
  }

  if(query.limit) {
    aggregate_query.push({ $limit : query.limit }); // limit
  }

  return aggregate_query;
}
// --------------------------------------------------------------------------------------
// add initial removed condition to aggregation query
// --------------------------------------------------------------------------------------
exp.add_cond = function(aggregate_query, cond)
{
  if(Object.keys(cond).length > 0)
    aggregate_query.push({ $match : cond });    // check

  return aggregate_query;
}
// --------------------------------------------------------------------------------------
module.exports = exp;
