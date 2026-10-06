const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const AIInsight = require('../models/AIInsight');
const { analyze } = require('../services/aiService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const analyzePatient = asyncHandler(async (req, res) => {
  const {
    patientId,
    symptoms,
    currentCondition,
  } = req.body;

  if (
    !patientId ||
    !mongoose.isValidObjectId(patientId)
  ) {
    throw new ApiError(400, 'Invalid patient ID');
  }

  if (
    typeof symptoms !== 'string' ||
    symptoms.trim().length === 0
  ) {
    throw new ApiError(400, 'Symptoms are required');
  }

  if (symptoms.trim().length > 3000) {
    throw new ApiError(
      400,
      'Symptoms must not exceed 3000 characters'
    );
  }

  if (
    currentCondition !== undefined &&
    typeof currentCondition !== 'string'
  ) {
    throw new ApiError(
      400,
      'Current condition must be a string'
    );
  }

  if (
    typeof currentCondition === 'string' &&
    currentCondition.length > 2000
  ) {
    throw new ApiError(
      400,
      'Current condition must not exceed 2000 characters'
    );
  }

  // Only allow the logged-in doctor
  // to access their own patient.
  const patient = await Patient.findOne({
    _id: patientId,
    doctor: req.user._id,
  }).lean();

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  // Privacy minimization:
  // Patient name, phone, email and other
  // identifying information are NOT sent
  // to the AI provider.
  const patientContext = {
    age: patient.age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    medicalHistory: patient.medicalHistory,
  };

  const result = await analyze({
    patientContext,
    symptoms: symptoms.trim(),
    currentCondition:
      typeof currentCondition === 'string'
        ? currentCondition.trim()
        : '',
  });

  const insight = await AIInsight.create({
    doctor: req.user._id,
    patient: patient._id,
    symptoms: symptoms.trim(),
    currentCondition:
      typeof currentCondition === 'string'
        ? currentCondition.trim()
        : '',
    summary: result.summary,
    riskLevel: result.riskLevel,
    warningFlags: result.warningFlags,
    considerations: result.considerations,
    disclaimer: result.disclaimer,
    escalatedBySafetyRules:
      result.escalatedBySafetyRules,
    provider: process.env.AI_PROVIDER || 'mock',
  });

  res.status(201).json({
    success: true,
    message: 'AI analysis completed successfully',
    insight,
  });
});

const getPatientInsights = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (!mongoose.isValidObjectId(patientId)) {
    throw new ApiError(400, 'Invalid patient ID');
  }

  // Make sure this patient belongs
  // to the logged-in doctor.
  const patient = await Patient.findOne({
    _id: patientId,
    doctor: req.user._id,
  }).select('_id');

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  const insights = await AIInsight.find({
    doctor: req.user._id,
    patient: patientId,
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    patientId,
    count: insights.length,
    insights,
  });
});

module.exports = {
  analyzePatient,
  getPatientInsights,
};
