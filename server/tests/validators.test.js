const { validationResult } = require('express-validator');

const {
  createPatientRules,
  listPatientsRules,
} = require('../src/validators/patientValidators');

const {
  createAppointmentRules,
  listAppointmentsRules,
} = require('../src/validators/appointmentValidators');

const escapeRegex = require('../src/utils/escapeRegex');

const failedFields = async (rules, req) => {
  await Promise.all(
    rules.map((rule) => rule.run(req))
  );

  return validationResult(req)
    .array()
    .map((error) => error.path);
};

describe('patient validators', () => {
  test('valid patient passes', async () => {
    const fields = await failedFields(
      createPatientRules,
      {
        body: {
          name: 'Test Patient',
          age: 45,
          gender: 'Female',
          bloodGroup: 'O+',
        },
      }
    );

    expect(fields).toEqual([]);
  });

  test('invalid patient reports name, age and gender', async () => {
    const fields = await failedFields(
      createPatientRules,
      {
        body: {
          name: 'A',
          age: 200,
          gender: 'Robot',
        },
      }
    );

    expect(fields).toEqual(
      expect.arrayContaining([
        'name',
        'age',
        'gender',
      ])
    );
  });

  test('missing required fields are reported', async () => {
    const fields = await failedFields(
      createPatientRules,
      {
        body: {},
      }
    );

    expect(fields).toEqual(
      expect.arrayContaining([
        'name',
        'age',
        'gender',
      ])
    );
  });

  test('NoSQL injection in search is rejected', async () => {
    const fields = await failedFields(
      listPatientsRules,
      {
        query: {
          search: {
            $ne: '',
          },
        },
      }
    );

    expect(fields).toContain('search');
  });
});

describe('appointment validators', () => {
  const validBody = {
    patientId: '507f1f77bcf86cd799439011',
    appointmentDate: '2099-12-31',
    timeSlot: '09:30',
  };

  test('valid appointment passes', async () => {
    const fields = await failedFields(
      createAppointmentRules,
      {
        body: {
          ...validBody,
        },
      }
    );

    expect(fields).toEqual([]);
  });

  test('bad id, impossible date and bad time are all reported', async () => {
    const fields = await failedFields(
      createAppointmentRules,
      {
        body: {
          patientId: 'abc',
          appointmentDate: '2025-02-30',
          timeSlot: '25:99',
        },
      }
    );

    expect(fields).toEqual(
      expect.arrayContaining([
        'patientId',
        'appointmentDate',
        'timeSlot',
      ])
    );
  });

  test('past date is rejected', async () => {
    const fields = await failedFields(
      createAppointmentRules,
      {
        body: {
          ...validBody,
          appointmentDate: '2020-01-01',
        },
      }
    );

    expect(fields).toContain('appointmentDate');
  });

  test('NoSQL injection in status filter is rejected', async () => {
    const fields = await failedFields(
      listAppointmentsRules,
      {
        query: {
          status: {
            $ne: '',
          },
        },
      }
    );

    expect(fields).toContain('status');
  });
});

describe('escapeRegex', () => {
  test('special characters are escaped', () => {
    expect(
      escapeRegex('john.*(doe)')
    ).toBe(
      'john\\.\\*\\(doe\\)'
    );
  });
});
