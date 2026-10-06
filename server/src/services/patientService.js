const Patient = require('../models/Patient');
const escapeRegex = require('../utils/escapeRegex');

const createPatient = async (doctorId, data) => {
  const patient = await Patient.create({
    doctor: doctorId,
    ...data,
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
  return Patient.findOneAndUpdate(
    {
      _id: patientId,
      doctor: doctorId,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

const deletePatient = async (doctorId, patientId) => {
  return Patient.findOneAndDelete({
    _id: patientId,
    doctor: doctorId,
  });
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
