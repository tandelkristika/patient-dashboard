const { body, param, query } = require('express-validator');

const { STATUSES } = require('../utils/appointmentStatus');

const {
  isValidDateString,
  toUtcDate,
  getTodayString,
} = require('../utils/dateUtils');

const SCOPES = ['today', 'upcoming', 'past'];

const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const dateRules = (chain) =>
  chain
    .isString()
    .withMessage('Date must be text in YYYY-MM-DD format')
    .bail()
    .custom(isValidDateString)
    .withMessage('Date must be a real date in YYYY-MM-DD format')
    .bail()
    .custom((value) => value >= getTodayString())
    .withMessage('Appointment date cannot be in the past')
    .customSanitizer(toUtcDate);

const createAppointmentRules = [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID'),

  dateRules(body('appointmentDate')),

  body('timeSlot')
    .isString()
    .bail()
    .matches(TIME_SLOT_PATTERN)
    .withMessage(
      'Time slot must be HH:mm in 24-hour format, e.g. 09:30'
    ),

  body('symptoms')
    .optional()
    .isString()
    .withMessage('Symptoms must be text')
    .trim()
    .isLength({ max: 2000 }),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be text')
    .trim()
    .isLength({ max: 2000 }),
];

const updateAppointmentRules = [
  dateRules(body('appointmentDate').optional()),

  body('timeSlot')
    .optional()
    .isString()
    .bail()
    .matches(TIME_SLOT_PATTERN)
    .withMessage(
      'Time slot must be HH:mm in 24-hour format, e.g. 09:30'
    ),

  body('status')
    .optional()
    .isString()
    .bail()
    .isIn(STATUSES)
    .withMessage(
      `Status must be one of: ${STATUSES.join(', ')}`
    ),

  body('symptoms')
    .optional()
    .isString()
    .withMessage('Symptoms must be text')
    .trim()
    .isLength({ max: 2000 }),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be text')
    .trim()
    .isLength({ max: 2000 }),
];

const appointmentIdRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid appointment ID'),
];

const listAppointmentsRules = [
  query('status')
    .optional()
    .isString()
    .bail()
    .isIn(STATUSES),

  query('scope')
    .optional()
    .isString()
    .bail()
    .isIn(SCOPES),

  query('date')
    .optional()
    .isString()
    .bail()
    .custom(isValidDateString)
    .withMessage('Date must be YYYY-MM-DD'),

  query('patientId')
    .optional()
    .isString()
    .bail()
    .isMongoId()
    .withMessage('Invalid patient ID'),

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
  createAppointmentRules,
  updateAppointmentRules,
  appointmentIdRules,
  listAppointmentsRules,
};
