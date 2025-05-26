// File: backend/routes/tiket.js (Final Enhanced Version)
const express = require('express');
const { 
  getMyTickets, 
  getTicketById, 
  getAvailableSeats,
  cancelTicket
} = require('../controllers/tiketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/tiket/my-tickets
// @desc    Get all tickets for authenticated user
// @access  Private
router.get('/my-tickets', getMyTickets);

// @route   GET /api/tiket/available-seats/:routeId
// @desc    Get available seats for a route (with reservation status)
// @access  Private
router.get('/available-seats/:routeId', getAvailableSeats);

// @route   PUT /api/tiket/cancel/:id
// @desc    Cancel ticket by ID
// @access  Private
router.put('/cancel/:id', cancelTicket);

// @route   GET /api/tiket/:id
// @desc    Get ticket by ID for authenticated user
// @access  Private
router.get('/:id', getTicketById);

module.exports = router;