const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  createPatientRules,
  updatePatientRules,
  patientIdRules,
  listPatientsRules,
} = require('../validators/patientValidators');

const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');

const router = express.Router();

// All patient routes require a logged-in doctor
router.use(authMiddleware);

// GET /api/patients
router.get(
  '/',
  listPatientsRules,
  validate,
  getPatients
);

// POST /api/patients
router.post(
  '/',
  createPatientRules,
  validate,
  createPatient
);

// GET /api/patients/:id
router.get(
  '/:id',
  patientIdRules,
  validate,
  getPatientById
);

// PUT /api/patients/:id
router.put(
  '/:id',
  patientIdRules,
  updatePatientRules,
  validate,
  updatePatient
);

// DELETE /api/patients/:id
router.delete(
  '/:id',
  patientIdRules,
  validate,
  deletePatient
);

module.exports = router;
