const { validateEnv } = require('../src/config/env');
const { clean } = require('../src/middleware/sanitizeBody');

let passed = 0;
let total = 0;

const check = (name, condition) => {
  total += 1;

  if (condition) {
    passed += 1;
  }

  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
};

const goodSecret = 'a'.repeat(48);

const goodEnv = {
  MONGODB_URI: 'mongodb://x',
  JWT_SECRET: goodSecret,
  CLIENT_URL: 'http://localhost:5173',
};

// ---- Environment validation ----

check(
  'good env has no problems',
  validateEnv(goodEnv).length === 0
);

check(
  'missing JWT_SECRET detected',
  validateEnv({
    ...goodEnv,
    JWT_SECRET: '',
  }).some((p) => p.includes('JWT_SECRET'))
);

check(
  'short JWT_SECRET detected',
  validateEnv({
    ...goodEnv,
    JWT_SECRET: 'short',
  }).some((p) => p.includes('at least 32'))
);

check(
  'placeholder secret rejected',
  validateEnv({
    ...goodEnv,
    JWT_SECRET: 'replace-with-a-long-random-string',
  }).length > 0
);

check(
  'missing MONGODB_URI detected',
  validateEnv({
    ...goodEnv,
    MONGODB_URI: undefined,
  }).some((p) => p.includes('MONGODB_URI'))
);

check(
  'production requires https',
  validateEnv({
    ...goodEnv,
    NODE_ENV: 'production',
    AI_PROVIDER: 'x',
  }).some((p) => p.includes('https'))
);

check(
  'production rejects mock AI',
  validateEnv({
    ...goodEnv,
    CLIENT_URL: 'https://x.com',
    NODE_ENV: 'production',
    AI_PROVIDER: 'mock',
  }).some((p) => p.includes('mock'))
);

check(
  'problem list never contains the secret value',
  !validateEnv({
    ...goodEnv,
    JWT_SECRET: 'short',
  })
    .join(' ')
    .includes('short,')
);

// ---- Body sanitizing ----

const login = clean({
  email: {
    $gt: '',
  },
  password: 'x',
});

check(
  'operator object $gt removed',
  !('$gt' in (login.email || {}))
);

check(
  'normal fields kept',
  login.password === 'x'
);

const nested = clean({
  a: {
    b: [
      {
        $where: 'evil',
        ok: 1,
      },
    ],
  },
});

check(
  'nested operator removed inside arrays',
  nested.a.b[0].ok === 1 &&
    !('$where' in nested.a.b[0])
);

const dotted = clean({
  'a.b': 1,
  c: 2,
});

check(
  'dotted keys removed',
  !('a.b' in dotted) &&
    dotted.c === 2
);

const proto = clean(
  JSON.parse(
    '{"__proto__": {"admin": true}, "name": "x"}'
  )
);

check(
  '__proto__ key removed',
  proto.name === 'x' &&
    Object.keys(proto).includes('__proto__') === false
);

const arrayResult = clean([1, 'a', null]);

check(
  'arrays and primitives pass through',
  arrayResult.length === 3 &&
    clean('text') === 'text'
);

console.log(`\n${passed}/${total} checks passed`);
