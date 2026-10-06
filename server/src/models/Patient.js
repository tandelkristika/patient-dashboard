const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const allergySchema = new mongoose.Schema(
  {
    substance: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    reaction: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);

const surgerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);

const medicalHistorySchema = new mongoose.Schema(
  {
    conditions: {
      type: [conditionSchema],
      default: [],
    },

    allergies: {
      type: [allergySchema],
      default: [],
    },

    medications: {
      type: [medicationSchema],
      default: [],
    },

    surgeries: {
      type: [surgerySchema],
      default: [],
    },

    familyHistory: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    lifestyleNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
      max: 130,
    },

    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },

    bloodGroup: {
      type: String,
      enum: [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
        'Unknown',
      ],
      default: 'Unknown',
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    medicalHistory: {
      type: medicalHistorySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ doctor: 1, name: 1 });
patientSchema.index({ doctor: 1, email: 1 });

module.exports = mongoose.model('Patient', patientSchema);
