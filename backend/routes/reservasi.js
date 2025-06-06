const express = require('express');
const autoCleanupMiddleware = require('../middleware/autoCleanup');
const {
  createTempReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  getRouteReservations
} = require('../controllers/reservasiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes - user must be authenticated
router.use(protect);

// Create temporary reservation (hold seats for 1 hour)
router.post('/temp', autoCleanupMiddleware, createTempReservation);

// Get all reservations for authenticated user
router.get('/user', getUserReservations);

// Get all active reservations for a specific route
router.get('/route/:routeId', getRouteReservations);

// Get specific reservation by ID
router.get('/:id', getReservationById);

// Cancel specific reservation
router.put('/cancel/:id', cancelReservation);

module.exports = router;