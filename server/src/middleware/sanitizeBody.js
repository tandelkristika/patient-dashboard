// Removes keys that start with "$" or contain "." anywhere
// in the body to prevent MongoDB operator injection.
const clean = (value) => {
  if (Array.isArray(value)) {
    return value.map(clean);
  }

  if (value && typeof value === 'object') {
    const result = {};

    Object.keys(value).forEach((key) => {
      if (
        key.startsWith('$') ||
        key.includes('.') ||
        key === '__proto__'
      ) {
        return;
      }

      result[key] = clean(value[key]);
    });

    return result;
  }

  return value;
};

const sanitizeBody = (req, res, next) => {
  if (
    req.body &&
    typeof req.body === 'object'
  ) {
    req.body = clean(req.body);
  }

  next();
};

module.exports = {
  sanitizeBody,
  clean,
};
