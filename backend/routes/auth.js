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
  makeAdmin,
  verifyOTP,
  resendOTP,
  changePassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

// Admin routes (protected with admin role)
router.put('/make-admin/:id', protect, authorize('admin'), makeAdmin);

module.exports = router;