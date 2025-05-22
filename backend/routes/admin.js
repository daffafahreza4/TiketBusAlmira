const express = require('express');
const {
  getAllUsers,
  getUserById, 
  updateUser,
  deleteUser,
  createBus,
  getAllBuses,
  updateBus,
  deleteBus,
  createRoute,
  updateRoute,
  deleteRoute,
  getAllTickets,
  updateTicketStatus,
  getDashboardStats
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Bus management routes
router.post('/buses', createBus);
router.get('/buses', getAllBuses);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Route management routes
router.post('/routes', createRoute);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);

// Ticket management routes
router.get('/tickets', getAllTickets);
router.put('/tickets/:id/status', updateTicketStatus);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;