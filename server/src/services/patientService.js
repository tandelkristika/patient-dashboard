const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const AIInsight = require('../models/AIInsight');
const Appointment = require('../models/Appointment');
const escapeRegex = require('../utils/escapeRegex');
const { pickPatientFields } = require('../utils/pickPatientFields');

const createPatient = async (doctorId, data) => {
  // `doctor` is set LAST so a request body can never override the owner.
  const patient = await Patient.create({
    ...pickPatientFields(data),
    doctor: doctorId,
  });

  return patient;
};

const getPatients = async (doctorId, filters = {}) => {
  const {
    search,
    gender,
    bloodGroup,
    page = 1,
    limit = 20,
  } = filters;

  const query = {
    doctor: doctorId,
  };

  if (search) {
    const safeSearch = escapeRegex(search);

    query.$or = [
      {
        name: {
          $regex: safeSearch,
          $options: 'i',
        },
      },
      {
        email: {
          $regex: safeSearch,
          $options: 'i',
        },
      },
      {
        phone: {
          $regex: safeSearch,
          $options: 'i',
        },
      },
    ];
  }

  if (gender) {
    query.gender = gender;
  }

  if (bloodGroup) {
    query.bloodGroup = bloodGroup;
  }

  const skip = (page - 1) * limit;

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Patient.countDocuments(query),
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getPatientById = async (doctorId, patientId) => {
  return Patient.findOne({
    _id: patientId,
    doctor: doctorId,
  });
};

const updatePatient = async (doctorId, patientId, data) => {
  // Only whitelisted fields are written. The filter includes the doctor id,
  // so a doctor can only ever update their own patients.
  return Patient.findOneAndUpdate(
    {
      _id: patientId,
      doctor: doctorId,
    },
    { $set: pickPatientFields(data) },
    {
      new: true,
      runValidators: true,
    }
  );
};

// Deletes the patient AND everything that belongs to them, all-or-nothing.
// Transactions need a replica set, which MongoDB Atlas always provides.
const deletePatient = async (doctorId, patientId) => {
  const session = await mongoose.startSession();

  try {
    let deletedPatient = null;

    await session.withTransaction(async () => {
      // withTransaction may run this function again after a temporary error
      deletedPatient = null;

      deletedPatient = await Patient.findOneAndDelete(
        {
          _id: patientId,
          doctor: doctorId,
        },
        { session }
      );

      // Not found, or not owned by this doctor: nothing else is touched
      if (!deletedPatient) return;

      await AIInsight.deleteMany(
        { patient: deletedPatient._id },
        { session }
      );

      await Appointment.deleteMany(
        { patient: deletedPatient._id },
        { session }
      );
    });

    return deletedPatient;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};