const { validationResult } = require('express-validator');

const escapeRegex = require('../src/utils/escapeRegex');

const {
  createPatientRules,
  listPatientsRules,
} = require('../src/validators/patientValidators');

const runRules = async (rules, req) => {
  await Promise.all(rules.map((rule) => rule.run(req)));

  return validationResult(req)
    .array()
    .map((e) => `${e.path}: ${e.msg}`);
};

(async () => {
  console.log('--- Test 1: valid patient ---');

  console.log(
    await runRules(createPatientRules, {
      body: {
        name: 'Test Patient',
        age: 45,
        gender: 'Female',
        bloodGroup: 'O+',
      },
    })
  );

  console.log('--- Test 2: invalid patient ---');

  console.log(
    await runRules(createPatientRules, {
      body: {
        name: 'A',
        age: 200,
        gender: 'Robot',
      },
    })
  );

  console.log('--- Test 3: injection attempt ---');

  console.log(
    await runRules(listPatientsRules, {
      query: {
        search: {
          $ne: '',
        },
      },
    })
  );

  console.log('--- Test 4: escapeRegex ---');

  console.log(escapeRegex('john.*(doe)'));
})();
