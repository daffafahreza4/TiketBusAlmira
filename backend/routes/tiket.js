const express = require('express');
const autoCleanupMiddleware = require('../middleware/autoCleanup');
const { 
  getMyTickets, 
  getTicketById, 
  getAvailableSeats,
  cancelTicket,
  checkSeatAvailability,
  getGroupedTicketById
} = require('../controllers/tiketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all tickets for authenticated user
router.get('/my-tickets', getMyTickets);

// Get available seats for a route (with reservation status)
router.get('/available-seats/:routeId', autoCleanupMiddleware, getAvailableSeats);
router.post('/check-seat-availability/:routeId', autoCleanupMiddleware, checkSeatAvailability);

// Cancel ticket by ID
router.put('/cancel/:id', cancelTicket);
router.get('/grouped/:id', getGroupedTicketById);

// Get ticket by ID for authenticated user
router.get('/:id', getTicketById);

module.exports = router;