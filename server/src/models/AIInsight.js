const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },

    symptoms: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    currentCondition: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    summary: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    riskLevel: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High'],
    },

    warningFlags: {
      type: [String],
      default: [],
    },

    considerations: {
      type: [String],
      default: [],
    },

    disclaimer: {
      type: String,
      required: true,
    },

    escalatedBySafetyRules: {
      type: Boolean,
      default: false,
    },

    provider: {
      type: String,
      default: 'mock',
      maxlength: 50,
    },
  },
  {
    timestamps: true,
  }
);

aiInsightSchema.index({ doctor: 1, patient: 1, createdAt: -1 });

module.exports = mongoose.model('AIInsight', aiInsightSchema);