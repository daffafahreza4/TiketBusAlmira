const { checkExpiredReservations } = require('../controllers/reservasiController');
const { Tiket } = require('../models');
const { Op } = require('sequelize');

let cleanupInterval = null;


//  Start the cleanup job to check for expired reservations and tickets
//  Runs every 2 minutes for responsive cleanup
const startCleanupJob = () => {
  // Run immediately on start
  runCleanup();
  
  // Run every 2 minutes for faster cleanup of 30-minute reservations
  cleanupInterval = setInterval(() => {
    runCleanup();
  }, 2 * 60 * 1000); // 2 minutes
  
  console.log('🧹 Cleanup job started - running every 2 minutes');
};


// Stop the cleanup job

const stopCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Cleanup job stopped');
  }
};

// Run the comprehensive cleanup process
const runCleanup = async () => {
  try {
    let totalCleaned = 0;
    
    // 1. Clean expired reservations
    const reservationResult = await checkExpiredReservations();
    if (reservationResult.success && reservationResult.deletedCount > 0) {
      totalCleaned += reservationResult.deletedCount;
      console.log(`🧹 Cleaned ${reservationResult.deletedCount} expired reservations`);
    }
    
    // 2. Clean expired pending tickets (30 minutes old)
    const expiredTickets = await cleanExpiredTickets();
    if (expiredTickets > 0) {
      totalCleaned += expiredTickets;
      console.log(`🧹 Cleaned ${expiredTickets} expired pending tickets`);
    }
    
    // Log total cleanup if any items were cleaned
    if (totalCleaned > 0) {
      console.log(`✅ Total cleanup completed: ${totalCleaned} items cleaned`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
};

// Clean expired pending tickets (30 minutes after creation)
const cleanExpiredTickets = async () => {
  try {
    // Find tickets that are pending and older than 30 minutes
    const expiredTime = new Date(Date.now() - (30 * 60 * 1000)); // 30 minutes ago
    
    const expiredTickets = await Tiket.findAll({
      where: {
        status_tiket: 'pending',
        [Op.or]: [
          {
            batas_pembayaran: {
              [Op.lt]: new Date() // Payment deadline passed
            }
          },
          {
            tanggal_pemesanan: {
              [Op.lt]: expiredTime // Created more than 30 minutes ago
            }
          }
        ]
      }
    });

    if (expiredTickets.length > 0) {
      // Update tickets to expired status
      await Tiket.update(
        { status_tiket: 'expired' },
        {
          where: {
            id_tiket: {
              [Op.in]: expiredTickets.map(ticket => ticket.id_tiket)
            }
          }
        }
      );

      // Also update associated payments if they exist
      const { Pembayaran } = require('../models');
      await Pembayaran.update(
        { status: 'expired' },
        {
          where: {
            id_tiket: {
              [Op.in]: expiredTickets.map(ticket => ticket.id_tiket)
            },
            status: 'pending'
          }
        }
      );

      return expiredTickets.length;
    }

    return 0;
  } catch (error) {
    console.error('❌ Error cleaning expired tickets:', error);
    return 0;
  }
};

// Get cleanup job status
const getCleanupStatus = () => {
  return {
    isRunning: cleanupInterval !== null,
    intervalId: cleanupInterval,
    intervalMinutes: 2,
    reservationTimeout: 30, // minutes
    ticketTimeout: 30, // minutes
    nextRunIn: cleanupInterval ? '< 2 minutes' : 'Not scheduled'
  };
};

// Manual cleanup trigger (for testing or manual intervention)

const triggerManualCleanup = async () => {
  console.log('🔧 Manual cleanup triggered');
  return await runCleanup();
};


// Check if a specific reservation/ticket should be expired

const shouldExpire = (createdAt, timeoutMinutes = 30) => {
  const expiryTime = new Date(createdAt.getTime() + (timeoutMinutes * 60 * 1000));
  return new Date() > expiryTime;
};

module.exports = {
  startCleanupJob,
  stopCleanupJob,
  runCleanup,
  getCleanupStatus,
  triggerManualCleanup,
  cleanExpiredTickets,
  shouldExpire
};