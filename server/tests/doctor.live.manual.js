require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../src/models/Doctor');

const keep = process.argv.includes('--keep');

let passed = 0;
let total = 0;

const check = (name, condition) => {
  total += 1;

  if (condition) {
    passed += 1;
  }

  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  await Doctor.init();

  await Doctor.deleteMany({
    email: 'live.test@example.com',
  });

  const created = await Doctor.create({
    name: 'Live Test Doctor',
    email: 'live.test@example.com',
    passwordHash: await Doctor.hashPassword('CorrectHorse9'),
    specialization: 'General Medicine',
  });

  check('doctor saved with an _id', Boolean(created._id));

  const plain = await Doctor.findOne({
    email: 'live.test@example.com',
  });

  check(
    'passwordHash hidden from a normal query',
    plain.passwordHash === undefined
  );

  const withHash = await Doctor.findOne({
    email: 'live.test@example.com',
  }).select('+passwordHash');

  check(
    'passwordHash available when explicitly requested',
    typeof withHash.passwordHash === 'string'
  );

  check(
    'correct password verifies',
    await withHash.comparePassword('CorrectHorse9')
  );

  check(
    'wrong password fails',
    !(await withHash.comparePassword('nope'))
  );

  const duplicate = await Doctor.create({
    name: 'Duplicate',
    email: 'LIVE.TEST@example.com',
    passwordHash: await Doctor.hashPassword('CorrectHorse9'),
    specialization: 'X1',
  }).catch((e) => e);

  check(
    'duplicate email (any letter case) is rejected',
    duplicate && duplicate.code === 11000
  );

  if (!keep) {
    await Doctor.deleteMany({
      email: 'live.test@example.com',
    });
  }

  console.log(
    `\n${passed}/${total} checks passed${
      keep ? ' (test doctor kept in the database)' : ''
    }`
  );

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Live check failed:', err.message);
  process.exit(1);
});
