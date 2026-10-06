// "https://a.com/, https://b.com" -> ['https://a.com', 'https://b.com']
const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

// Only listed origins get CORS headers.
// Requests with no Origin header (health checks, curl) are allowed.
// CORS is a browser security rule, not authentication.
const buildCorsOptions = (env = process.env) => {
  const allowed = parseOrigins(env.CLIENT_URL);

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      return callback(null, allowed.includes(origin));
    },

    credentials: true,
  };
};

// Number of proxies in front of the server.
// Render/Railway etc. usually use 1.
// Never use `true`.
const getTrustProxy = (value) => {
  const hops = Number(value);

  return Number.isInteger(hops) &&
    hops > 0 &&
    hops <= 5
    ? hops
    : false;
};

module.exports = {
  parseOrigins,
  buildCorsOptions,
  getTrustProxy,
};