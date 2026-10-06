import {
  parseError,
  getErrorMessage,
} from '../src/utils/errorMessages.js';

let passed = 0;
let total = 0;

const check = (name, condition) => {
  total += 1;

  if (condition) {
    passed += 1;
  }

  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
};

const serverError = (status, data) => ({
  response: {
    status,
    data,
  },
});

// Validation errors
let r = parseError(
  serverError(400, {
    success: false,
    message: 'Validation failed',
    errors: [
      {
        field: 'email',
        message: 'Invalid email',
      },
      {
        field: 'email',
        message: 'Second email problem',
      },
      {
        field: 'age',
        message:
          'Age must be a whole number from 0 to 130',
      },
    ],
  })
);

check(
  '400 keeps server message',
  r.message === 'Validation failed' &&
    r.type === 'validation'
);

check(
  'field errors mapped, first message wins',
  r.fieldErrors.email === 'Invalid email' &&
    r.fieldErrors.age.startsWith('Age')
);

r = parseError(
  serverError(409, {
    success: false,
    message:
      'A record with this email already exists',
  })
);

check(
  '409 duplicate shows server message',
  r.message.includes('already exists')
);

// Auth
r = parseError(
  serverError(401, {
    success: false,
    message: 'jwt malformed',
  })
);

check(
  '401 uses fixed message, hides server text',
  r.type === 'unauthorized' &&
    !r.message.includes('jwt')
);

r = parseError(
  serverError(403, {
    success: false,
    message: 'anything',
  })
);

check(
  '403 permission message',
  r.message.includes('permission')
);

// Server errors never leak
r = parseError(
  serverError(500, {
    success: false,
    message:
      'MongoServerError: password hunter2',
  })
);

check(
  '500 hides server text',
  r.type === 'server' &&
    !r.message.includes('hunter2')
);

r = parseError(
  serverError(503, {
    success: false,
    message: 'internal detail',
  })
);

check(
  '503 hides server text',
  !r.message.includes('internal')
);

// AI-specific
r = parseError(
  serverError(504, {
    success: false,
    message:
      'The AI service took too long to respond. Please try again.',
  })
);

check(
  'AI timeout (504) keeps friendly message',
  r.message.includes('AI service took too long')
);

r = parseError(
  serverError(502, {
    success: false,
    message:
      'The AI service is currently unavailable. Please try again later.',
  })
);

check(
  'AI unavailable (502) keeps friendly message',
  r.message.includes(
    'AI service is currently unavailable'
  )
);

r = parseError(
  serverError(429, {
    success: false,
    message: 'x',
  })
);

check(
  '429 rate limit message',
  r.message.includes('Too many requests')
);

// Malformed server data
r = parseError(serverError(400, null));

check(
  '400 with no body falls back safely',
  r.message ===
    'Something went wrong. Please try again.'
);

// Unknown status with HTML body
r = parseError(
  serverError(418, '<html>weird</html>')
);

check(
  'unknown status with HTML body is safe',
  !r.message.includes('<html>')
);

// Non-response failures
r = parseError({
  code: 'ECONNABORTED',
  request: {},
});

check(
  'timeout detected',
  r.type === 'timeout'
);

r = parseError({
  request: {},
  message: 'Network Error',
});

check(
  'network failure detected',
  r.type === 'network' &&
    r.message.includes('Cannot reach the server')
);

r = parseError(
  new Error('Cannot read properties of undefined')
);

check(
  'code bug hides its message',
  r.type === 'unknown' &&
    !r.message.includes('undefined')
);

check(
  'null input is safe',
  getErrorMessage(null) ===
    'Something went wrong. Please try again.'
);

check(
  'undefined input is safe',
  getErrorMessage(undefined) ===
    'Something went wrong. Please try again.'
);

console.log(`\n${passed}/${total} checks passed`);
