const express = require('express');

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', protect, getMe);

router.put('/profile', protect, updateProfile);

router.put('/password', protect, changePassword);

router.delete('/me', protect, deleteAccount);

module.exports = router;