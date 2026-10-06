const { validationResult } = require('express-validator');

const { canTransition } = require('../src/utils/appointmentStatus');

const {
  getTodayString,
  getDayRange,
} = require('../src/utils/dateUtils');

const {
  createAppointmentRules,
  listAppointmentsRules,
} = require('../src/validators/appointmentValidators');

const runRules = async (rules, req) => {
  await Promise.all(
    rules.map((rule) => rule.run(req))
  );

  return validationResult(req)
    .array()
    .map((e) => `${e.path}: ${e.msg}`);
};

(async () => {
  console.log('--- Test 1: valid appointment ---');

  console.log(
    await runRules(createAppointmentRules, {
      body: {
        patientId: '507f1f77bcf86cd799439011',
        appointmentDate: '2099-12-31',
        timeSlot: '09:30',
        symptoms: 'Headache',
      },
    })
  );

  console.log('--- Test 2: invalid appointment ---');

  console.log(
    await runRules(createAppointmentRules, {
      body: {
        patientId: 'abc',
        appointmentDate: '2025-02-30',
        timeSlot: '25:99',
      },
    })
  );

  console.log('--- Test 3: past date ---');

  console.log(
    await runRules(createAppointmentRules, {
      body: {
        patientId: '507f1f77bcf86cd799439011',
        appointmentDate: '2020-01-01',
        timeSlot: '10:00',
      },
    })
  );

  console.log('--- Test 4: injection in status filter ---');

  console.log(
    await runRules(listAppointmentsRules, {
      query: {
        status: { $ne: '' },
      },
    })
  );

  console.log('--- Test 5: status transitions ---');

  console.log(
    canTransition('Scheduled', 'Completed'),
    canTransition('Completed', 'Scheduled'),
    canTransition('Cancelled', 'Completed')
  );

  console.log('--- Test 6: day range ---');

  console.log(getDayRange('2099-12-31'));

  console.log('--- Test 7: today ---');

  console.log(getTodayString());
})();
