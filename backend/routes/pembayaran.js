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

// Get available payment methods
router.get('/methods', getPaymentMethods);

// Handle Midtrans webhook notification
router.post('/notification', handleNotification);

// Protected routes - require authentication
router.use(protect);

// Create payment token (Snap token)
router.post('/create', createPaymentToken);

// Check payment status for a ticket
router.get('/status/:id_tiket', checkPaymentStatus);

// Cancel payment for a ticket
router.put('/cancel/:id_tiket', cancelPayment);

// Admin routes - require admin role
router.use(authorize('admin'));

// Get webhook statistics and monitoring data
router.get('/webhook/stats', getWebhookStats);

// Clean up old webhook logs
router.post('/webhook/cleanup', cleanupWebhookLogs);

module.exports = router;