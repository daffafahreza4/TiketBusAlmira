const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  resetPasswordSMS,
  verifySMSCode,
  makeAdmin
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/resetpassword/sms', resetPasswordSMS);
router.post('/verifysms', verifySMSCode);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes (protected with admin role)
router.put('/make-admin/:id', protect, authorize('admin'), makeAdmin);

module.exports = router;