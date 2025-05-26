const express = require('express');
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

// @route   POST /api/reservasi/temp
// @desc    Create temporary reservation (hold seats for 1 hour)
// @access  Private
router.post('/temp', createTempReservation);

// @route   GET /api/reservasi/user
// @desc    Get all reservations for authenticated user
// @access  Private
router.get('/user', getUserReservations);

// @route   GET /api/reservasi/route/:routeId
// @desc    Get all active reservations for a specific route
// @access  Private
router.get('/route/:routeId', getRouteReservations);

// @route   GET /api/reservasi/:id
// @desc    Get specific reservation by ID
// @access  Private
router.get('/:id', getReservationById);

// @route   PUT /api/reservasi/cancel/:id
// @desc    Cancel specific reservation
// @access  Private
router.put('/cancel/:id', cancelReservation);

module.exports = router;