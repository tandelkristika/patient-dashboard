const { body, param, query } = require('express-validator');

const GENDERS = ['Male', 'Female', 'Other'];

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown',
];

const patientFields = (required) => {
  const start = (chain) =>
    required
      ? chain.exists({ values: 'falsy' }).withMessage('is required')
      : chain.optional();

  return [
    start(body('name'))
      .bail()
      .isString()
      .withMessage('Name must be text')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2 to 100 characters'),

    start(body('age'))
      .bail()
      .isInt({ min: 0, max: 130 })
      .withMessage('Age must be a whole number from 0 to 130')
      .toInt(),

    start(body('gender'))
      .bail()
      .isIn(GENDERS)
      .withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),

    body('bloodGroup')
      .optional()
      .isIn(BLOOD_GROUPS)
      .withMessage(
        `Blood group must be one of: ${BLOOD_GROUPS.join(', ')}`
      ),

    body('phone')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .matches(/^[0-9+\-\s()]{7,20}$/)
      .withMessage('Phone number format is invalid'),

    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Email format is invalid')
      .normalizeEmail(),

    body('medicalHistory')
      .optional()
      .isObject()
      .withMessage('Medical history must be an object'),

    body('medicalHistory.conditions')
      .optional()
      .isArray({ max: 50 })
      .withMessage('Too many conditions'),

    body('medicalHistory.conditions.*.name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 }),

    body('medicalHistory.conditions.*.notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 }),

    body('medicalHistory.allergies')
      .optional()
      .isArray({ max: 50 })
      .withMessage('Too many allergies'),

    body('medicalHistory.allergies.*.substance')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 }),

    body('medicalHistory.allergies.*.reaction')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 }),

    body('medicalHistory.medications')
      .optional()
      .isArray({ max: 50 })
      .withMessage('Too many medications'),

    body('medicalHistory.medications.*.name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 }),

    body('medicalHistory.medications.*.dosage')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 }),

    body('medicalHistory.surgeries')
      .optional()
      .isArray({ max: 50 })
      .withMessage('Too many surgeries'),

    body('medicalHistory.surgeries.*.name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 }),

    body('medicalHistory.familyHistory')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 }),

    body('medicalHistory.lifestyleNotes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 }),
  ];
};

const createPatientRules = patientFields(true);

const updatePatientRules = patientFields(false);

const patientIdRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid patient ID'),
];

const listPatientsRules = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be text')
    .trim()
    .isLength({ max: 100 }),

  query('gender')
    .optional()
    .isString()
    .isIn(GENDERS),

  query('bloodGroup')
    .optional()
    .isString()
    .isIn(BLOOD_GROUPS),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
];

module.exports = {
  createPatientRules,
  updatePatientRules,
  patientIdRules,
  listPatientsRules,
};
