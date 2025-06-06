const { checkExpiredReservations } = require('../controllers/reservasiController');
const { Tiket } = require('../models');
const { Op } = require('sequelize');

let cleanupInterval = null;


//  Start the cleanup job to check for expired reservations and tickets
//  Runs every 2 minutes for responsive cleanup
const startCleanupJob = () => {
  // Run immediately on start
  runCleanup();
  
  // UBAH: Run every 1 minute untuk auto-cancel yang lebih responsif
  cleanupInterval = setInterval(() => {
    runCleanup();
  }, 1 * 60 * 1000); 
  
  console.log(' Cleanup job started - running every 1 minute');
};


// Stop the cleanup job

const stopCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log(' Cleanup job stopped');
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
      console.log(` Cleaned ${reservationResult.deletedCount} expired reservations`);
    }

    // 2. Clean expired pending tickets (30 minutes old)
    const expiredTickets = await cleanExpiredTickets();
    if (expiredTickets > 0) {
      totalCleaned += expiredTickets;
      console.log(` Cleaned ${expiredTickets} expired pending tickets`);
    }

    // 3. AUTO-CANCEL DEPARTED TICKETS - TAMBAH INI
    const cancelledTickets = await autoCancelDepartedTickets();
    if (cancelledTickets > 0) {
      totalCleaned += cancelledTickets;
      console.log(` Auto-cancelled ${cancelledTickets} tickets for departed buses`);
    }

    // Log total cleanup if any items were cleaned
    if (totalCleaned > 0) {
      console.log(` Total cleanup completed: ${totalCleaned} items cleaned`);
    }

  } catch (error) {
    console.error(' Cleanup error:', error.message);
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

// Auto cancel tickets for departed buses
const autoCancelDepartedTickets = async () => {
  try {
    const { Tiket, Rute, Pembayaran } = require('../models');
    const { Op } = require('sequelize');

    // Find tickets for buses that have already departed
    const departedTickets = await Tiket.findAll({
      include: [{
        model: Rute,
        where: {
          waktu_berangkat: {
            [Op.lt]: new Date() // Departure time has passed
          }
        }
      }],
      where: {
        status_tiket: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });

    if (departedTickets.length > 0) {
      // Update tickets to cancelled
      await Tiket.update(
        { status_tiket: 'cancelled' },
        {
          where: {
            id_tiket: {
              [Op.in]: departedTickets.map(ticket => ticket.id_tiket)
            }
          }
        }
      );

      // Update associated payments
      await Pembayaran.update(
        { status: 'cancelled' },
        {
          where: {
            id_tiket: {
              [Op.in]: departedTickets.map(ticket => ticket.id_tiket)
            },
            status: {
              [Op.in]: ['pending', 'completed']
            }
          }
        }
      );

      console.log(`🚌 Auto-cancelled ${departedTickets.length} tickets for departed buses`);
      return departedTickets.length;
    }

    return 0;
  } catch (error) {
    console.error('❌ Error auto-cancelling departed tickets:', error);
    return 0;
  }
};

// Check if booking is still allowed (10 minutes before departure)
const isBookingAllowed = (departureTime) => {
  const now = new Date();
  const departure = new Date(departureTime);
  const timeDiff = departure - now;
  const minutesUntilDeparture = timeDiff / (1000 * 60);

  return minutesUntilDeparture > 10; // Allow booking if more than 10 minutes left
};

module.exports = {
  startCleanupJob,
  stopCleanupJob,
  runCleanup,
  getCleanupStatus,
  triggerManualCleanup,
  cleanExpiredTickets,
  shouldExpire,
  autoCancelDepartedTickets,
  isBookingAllowed
};