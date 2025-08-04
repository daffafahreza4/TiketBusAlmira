const express = require('express');
const {
  // Existing functions
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createBus,
  getAllBuses,
  updateBus,
  deleteBus,
  getAvailableBuses,
  createRoute,
  updateRoute,
  deleteRoute,
  getAllRoutes,
  getAllTickets,
  updateTicketStatus,
  getDashboardStats,
  createUser,
  deleteTicket,
  createVerifiedUser,
  
  // NEW: Super Admin specific methods
  getSuperAdminDashboardStats,
  getAllAdministrators,
  createVerifiedUserEnhanced,
  getSystemAnalytics
} = require('../controllers/adminController');

const { protect, authorize, authorizeSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// ================================
// 🚀 SUPER ADMIN EXCLUSIVE ROUTES
// ================================

// Super Admin Dashboard - Enhanced stats
router.get('/super/dashboard/stats', authorizeSuperAdmin, getSuperAdminDashboardStats);

// Super Admin User Management
router.get('/super/administrators', authorizeSuperAdmin, getAllAdministrators);
router.post('/super/users/create-verified', authorizeSuperAdmin, createVerifiedUserEnhanced);

// Super Admin Analytics
router.get('/super/analytics', authorizeSuperAdmin, getSystemAnalytics);

// ================================
// REGULAR ADMIN ROUTES (both admin and super_admin can access)
// ================================

// Apply admin/super_admin authorization for remaining routes
router.use(authorize('admin', 'super_admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users', createUser);

// EXISTING: Super admin can create verified users (backward compatibility)
router.post('/users/create-verified', authorize('super_admin'), createVerifiedUser);

// Bus management routes
router.post('/buses', createBus);
router.get('/buses', getAllBuses);
router.get('/buses/available', getAvailableBuses);  
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Route management routes
router.get('/routes', getAllRoutes);
router.post('/routes', createRoute);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);

// Ticket management routes
router.get('/tickets', getAllTickets);
router.put('/tickets/:id/status', updateTicketStatus);
router.delete('/tickets/:id', deleteTicket);

// Dashboard stats (regular admin dashboard)
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;