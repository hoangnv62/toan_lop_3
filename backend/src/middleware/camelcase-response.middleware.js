function toCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function deepCamel(val) {
  if (Array.isArray(val)) return val.map(deepCamel);
  if (val !== null && typeof val === 'object' && !(val instanceof Date))
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [toCamel(k), deepCamel(v)]));
  return val;
}

export function camelCaseResponse(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    return originalJson(deepCamel(data));
  };
  next();
}
