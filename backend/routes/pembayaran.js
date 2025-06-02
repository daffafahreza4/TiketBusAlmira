const express = require('express');
const {
  createPaymentToken,
  handleNotification,
  checkPaymentStatus,
  cancelPayment,
  getPaymentMethods,
  getWebhookStats,
  cleanupWebhookLogs
} = require('../controllers/pembayaranController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/pembayaran/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', getPaymentMethods);

// @route   POST /api/pembayaran/notification
// @desc    Handle Midtrans webhook notification
// @access  Public (Midtrans webhook)
router.post('/notification', handleNotification);

// Protected routes - require authentication
router.use(protect);

// @route   POST /api/pembayaran/create
// @desc    Create payment token (Snap token)
// @access  Private
router.post('/create', createPaymentToken);

// @route   GET /api/pembayaran/status/:id_tiket
// @desc    Check payment status for a ticket
// @access  Private
router.get('/status/:id_tiket', checkPaymentStatus);

// @route   PUT /api/pembayaran/cancel/:id_tiket
// @desc    Cancel payment for a ticket
// @access  Private
router.put('/cancel/:id_tiket', cancelPayment);

// Admin routes - require admin role
router.use(authorize('admin'));

// @route   GET /api/pembayaran/webhook/stats
// @desc    Get webhook statistics and monitoring data
// @access  Admin only
router.get('/webhook/stats', getWebhookStats);

// @route   POST /api/pembayaran/webhook/cleanup
// @desc    Clean up old webhook logs
// @access  Admin only
router.post('/webhook/cleanup', cleanupWebhookLogs);

module.exports = router;