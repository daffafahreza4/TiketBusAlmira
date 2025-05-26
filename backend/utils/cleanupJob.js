const { checkExpiredReservations } = require('../controllers/reservasiController');

let cleanupInterval = null;

/**
 * Start the cleanup job to check for expired reservations
 * Runs every 5 minutes
 */
const startCleanupJob = () => {
  console.log('🚀 [cleanupJob] Starting reservation cleanup job...');
  
  // Run immediately on start
  runCleanup();
  
  // Then run every 5 minutes (300,000 milliseconds)
  cleanupInterval = setInterval(() => {
    runCleanup();
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('✅ [cleanupJob] Cleanup job started - will run every 5 minutes');
};

/**
 * Stop the cleanup job
 */
const stopCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 [cleanupJob] Cleanup job stopped');
  }
};

/**
 * Run the cleanup process
 */
const runCleanup = async () => {
  try {
    console.log('🧹 [cleanupJob] Running cleanup at:', new Date().toISOString());
    
    const result = await checkExpiredReservations();
    
    if (result.success && result.deletedCount > 0) {
      console.log('✅ [cleanupJob] Cleanup completed:', {
        deletedCount: result.deletedCount,
        expiredReservations: result.expiredReservations
      });
    } else if (result.success) {
      console.log('✅ [cleanupJob] Cleanup completed - no expired reservations found');
    } else {
      console.error('❌ [cleanupJob] Cleanup failed:', result.error);
    }
  } catch (error) {
    console.error('❌ [cleanupJob] Cleanup error:', {
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Get cleanup job status
 */
const getCleanupStatus = () => {
  return {
    isRunning: cleanupInterval !== null,
    intervalId: cleanupInterval,
    nextRunIn: cleanupInterval ? '< 5 minutes' : 'Not scheduled'
  };
};

/**
 * Manual cleanup trigger (for testing or manual intervention)
 */
const triggerManualCleanup = async () => {
  console.log('🔧 [cleanupJob] Manual cleanup triggered');
  return await runCleanup();
};

module.exports = {
  startCleanupJob,
  stopCleanupJob,
  runCleanup,
  getCleanupStatus,
  triggerManualCleanup
};