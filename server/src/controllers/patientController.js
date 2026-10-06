const patientService = require('../services/patientService');
const asyncHandler = require('../utils/asyncHandler');

const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(
    req.user._id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: 'Patient created successfully',
    patient,
  });
});

const getPatients = asyncHandler(async (req, res) => {
  const result = await patientService.getPatients(
    req.user._id,
    req.query
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(
    req.user._id,
    req.params.id
  );

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  res.status(200).json({
    success: true,
    patient,
  });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient(
    req.user._id,
    req.params.id,
    req.body
  );

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Patient updated successfully',
    patient,
  });
});

const deletePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.deletePatient(
    req.user._id,
    req.params.id
  );

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Patient deleted successfully',
  });
});

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
