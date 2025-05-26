const express = require('express');
const {
  createTicketFromReservation,
  createTicket,
  getBookingSummary
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/from-reservation', createTicketFromReservation);
router.post('/direct', createTicket);
router.get('/summary/:id_reservasi', getBookingSummary);

module.exports = router;