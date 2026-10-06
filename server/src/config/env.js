const MIN_JWT_SECRET_LENGTH = 32;

const WEAK_SECRETS = [
  'secret',
  'changeme',
  'password',
  'replace-with-a-long-random-string',
  'your-secret',
];

// Returns a list of problems.
// Empty list means the environment is valid.
const validateEnv = (env = process.env) => {
  const problems = [];

  // Required environment variables
  ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'].forEach((name) => {
    if (!env[name] || env[name].trim() === '') {
      problems.push(`${name} is missing`);
    }
  });

  // JWT secret validation
  const secret = env.JWT_SECRET || '';

  if (secret && secret.length < MIN_JWT_SECRET_LENGTH) {
    problems.push(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`
    );
  }

  if (secret && WEAK_SECRETS.includes(secret.toLowerCase())) {
    problems.push('JWT_SECRET is a known weak value');
  }

  // Production-only validation
  if (env.NODE_ENV === 'production') {
    const origins = String(env.CLIENT_URL || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    // Production frontend must use HTTPS
    if (
      origins.some(
        (origin) => !origin.startsWith('https://')
      )
    ) {
      problems.push(
        'CLIENT_URL must use https:// in production'
      );
    }

    // Wildcard CORS is not allowed in production
    if (origins.includes('*')) {
      problems.push(
        'CLIENT_URL must not be a wildcard'
      );
    }

    // Mock AI provider is only for development/testing
    if (env.AI_PROVIDER === 'mock') {
      problems.push(
        'AI_PROVIDER must not be "mock" in production'
      );
    }

    // Production must explicitly define the proxy hop count
    if (
      !Number.isInteger(Number(env.TRUST_PROXY)) ||
      Number(env.TRUST_PROXY) < 1
    ) {
      problems.push(
        'TRUST_PROXY must be set to the number of proxies (usually 1) in production'
      );
    }
  }

  return problems;
};

// Call once at startup.
// Never prints secret values.
const assertEnv = () => {
  const problems = validateEnv();

  if (problems.length > 0) {
    console.error(
      'Invalid environment configuration:'
    );

    problems.forEach((problem) => {
      console.error(`  - ${problem}`);
    });

    process.exit(1);
  }
};

module.exports = {
  validateEnv,
  assertEnv,
};
