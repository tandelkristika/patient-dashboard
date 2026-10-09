const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const AIInsight = require('../models/AIInsight');

const generateToken = (doctorId) => {
  return jwt.sign(
    { id: doctorId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email, password and specialization are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingDoctor = await Doctor.findOne({
      email: normalizedEmail,
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const passwordHash = await Doctor.hashPassword(password);

    const doctor = await Doctor.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      specialization: specialization.trim(),
    });

    const token = generateToken(doctor._id.toString());

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const doctor = await Doctor.findOne({
      email: normalizedEmail,
    }).select('+passwordHash');

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const passwordMatches = await doctor.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(doctor._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    doctor: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      specialization: req.user.specialization,
    },
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, specialization } = req.body;

    if (!name || !email || !specialization) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email and specialization are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingDoctor = await Doctor.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered by another account',
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        email: normalizedEmail,
        specialization: specialization.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor account not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        createdAt: doctor.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Profile update failed',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'New password must be at least 8 characters',
      });
    }

    const doctor = await Doctor.findById(
      req.user._id
    ).select('+passwordHash');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor account not found',
      });
    }

    const passwordMatches =
      await doctor.comparePassword(currentPassword);

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    doctor.passwordHash =
      await Doctor.hashPassword(newPassword);

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);

    res.status(500).json({
      success: false,
      message: 'Password change failed',
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const doctorId = req.user._id;

    /*
     * Remove all AI insights belonging to this doctor.
     */
    await AIInsight.deleteMany({
      doctor: doctorId,
    });

    /*
     * Remove all patients belonging to this doctor.
     */
    await Patient.deleteMany({
      doctor: doctorId,
    });

    /*
     * Finally remove the doctor account.
     */
    const doctor = await Doctor.findByIdAndDelete(
      doctorId
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor account not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);

    res.status(500).json({
      success: false,
      message: 'Account deletion failed',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};