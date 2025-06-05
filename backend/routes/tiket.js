const express = require('express');
const { 
  getMyTickets, 
  getTicketById, 
  getAvailableSeats,
  cancelTicket,
  checkSeatAvailability 
} = require('../controllers/tiketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all tickets for authenticated user
router.get('/my-tickets', getMyTickets);

// Get available seats for a route (with reservation status)
router.get('/available-seats/:routeId', getAvailableSeats);
router.post('/check-seat-availability/:routeId', checkSeatAvailability);

// Cancel ticket by ID
router.put('/cancel/:id', cancelTicket);

// Get ticket by ID for authenticated user
router.get('/:id', getTicketById);

module.exports = router;