const { checkExpiredReservations } = require('../controllers/reservasiController');
const { cleanExpiredTickets } = require('../utils/cleanupJob');

/**
 * Middleware to automatically cleanup expired reservations before seat-related operations
 * This ensures real-time cleanup when users interact with seat selection
 */
const autoCleanupMiddleware = async (req, res, next) => {
  try {
    // Only run cleanup for seat-related routes to avoid performance impact
    const seatRelatedRoutes = [
      '/available-seats',
      '/check-seat-availability',
      '/temp', // reservation creation
    ];
    
    const shouldRunCleanup = seatRelatedRoutes.some(route => 
      req.path.includes(route)
    );
    
    if (shouldRunCleanup) {
      // Run quick cleanup without waiting for completion
      setImmediate(async () => {
        try {
          await checkExpiredReservations();
          await cleanExpiredTickets();
        } catch (error) {
          console.warn('⚠️ Auto-cleanup failed:', error.message);
        }
      });
    }
    
    next();
  } catch (error) {
    // Don't block the request if cleanup fails
    console.warn('⚠️ Auto-cleanup middleware error:', error.message);
    next();
  }
};

module.exports = autoCleanupMiddleware;