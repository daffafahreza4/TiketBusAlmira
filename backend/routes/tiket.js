const express = require('express');
const { 
  getMyTickets, 
  getTicketById, 
  getAvailableSeats 
} = require('../controllers/tiketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/tiket/my-tickets
// @desc    Get all tickets for authenticated user
// @access  Private
router.get('/my-tickets', getMyTickets);

// @route   GET /api/tiket/:id
// @desc    Get ticket by ID for authenticated user
// @access  Private
router.get('/:id', getTicketById);

// @route   GET /api/tiket/available-seats/:routeId
// @desc    Get available seats for a route
// @access  Private
router.get('/available-seats/:routeId', getAvailableSeats);

module.exports = router;