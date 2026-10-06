const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

const {
  analyzePatient,
  getPatientInsights,
} = require('../controllers/aiController');

const router = express.Router();

// All AI routes require authentication.
router.use(authMiddleware);

// Run a new AI analysis.
router.post(
  '/analyze',
  aiLimiter,
  analyzePatient
);

// Get previous AI insights for a patient.
router.get(
  '/insights/:patientId',
  getPatientInsights
);

module.exports = router;
