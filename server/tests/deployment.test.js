const {
  parseOrigins,
  buildCorsOptions,
  getTrustProxy,
} = require('../src/config/deployment');

const { validateEnv } = require('../src/config/env');

const askCors = (options, origin) =>
  new Promise((resolve) => {
    options.origin(origin, (err, allowed) => {
      resolve(allowed);
    });
  });

describe('parseOrigins', () => {
  test('splits, trims and removes trailing slashes', () => {
    expect(
      parseOrigins(
        ' https://a.com/ , https://b.com '
      )
    ).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  test('empty or missing input gives an empty list', () => {
    expect(parseOrigins('')).toEqual([]);
    expect(parseOrigins(undefined)).toEqual([]);
  });
});

describe('CORS options', () => {
  const options = buildCorsOptions({
    CLIENT_URL:
      'https://app.example.com/, https://www.example.com',
  });

  test('listed origins are allowed', async () => {
    expect(
      await askCors(
        options,
        'https://app.example.com'
      )
    ).toBe(true);

    expect(
      await askCors(
        options,
        'https://www.example.com'
      )
    ).toBe(true);
  });

  test('unlisted origins are refused', async () => {
    expect(
      await askCors(
        options,
        'https://evil.example.com'
      )
    ).toBe(false);
  });

  test('lookalike origins are refused', async () => {
    expect(
      await askCors(
        options,
        'https://app.example.com.evil.com'
      )
    ).toBe(false);

    expect(
      await askCors(
        options,
        'http://app.example.com'
      )
    ).toBe(false);
  });

  test('requests with no Origin header pass', async () => {
    expect(
      await askCors(options, undefined)
    ).toBe(true);
  });

  test('no configured origin refuses every browser origin', async () => {
    expect(
      await askCors(
        buildCorsOptions({}),
        'https://app.example.com'
      )
    ).toBe(false);
  });
});

describe('trust proxy', () => {
  test('a valid hop count is used', () => {
    expect(getTrustProxy('1')).toBe(1);
  });

  test('unsafe or empty values become false', () => {
    [
      'true',
      '',
      undefined,
      '0',
      '-1',
      '1.5',
      '99',
      'abc',
    ].forEach((value) => {
      expect(getTrustProxy(value)).toBe(false);
    });
  });
});

describe('production environment validation', () => {
  const good = {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://x',
    JWT_SECRET: 'a'.repeat(48),
    CLIENT_URL: 'https://app.example.com',
    AI_PROVIDER: 'anthropic',
    TRUST_PROXY: '1',
  };

  test('a correct production config has no problems', () => {
    expect(validateEnv(good)).toEqual([]);
  });

  test('http origin is rejected', () => {
    expect(
      validateEnv({
        ...good,
        CLIENT_URL: 'http://app.example.com',
      })
        .join()
    ).toContain('https');
  });

  test('one http origin in a list is rejected', () => {
    expect(
      validateEnv({
        ...good,
        CLIENT_URL:
          'https://a.com,http://b.com',
      })
        .join()
    ).toContain('https');
  });

  test('wildcard is rejected', () => {
    expect(
      validateEnv({
        ...good,
        CLIENT_URL: '*',
      }).length
    ).toBeGreaterThan(0);
  });

  test('mock AI is rejected', () => {
    expect(
      validateEnv({
        ...good,
        AI_PROVIDER: 'mock',
      })
        .join()
    ).toContain('mock');
  });

  test('missing TRUST_PROXY is rejected', () => {
    expect(
      validateEnv({
        ...good,
        TRUST_PROXY: '',
      })
        .join()
    ).toContain('TRUST_PROXY');
  });

  test('development does not require production settings', () => {
    expect(
      validateEnv({
        ...good,
        NODE_ENV: 'development',
        TRUST_PROXY: '',
        AI_PROVIDER: 'mock',
      })
    ).toEqual([]);
  });
});
