const cron = require('node-cron');
const { Tiket, ReservasiSementara, Rute } = require('../models');
const { Op } = require('sequelize');

// Track if cleanup job is running
let isCleanupJobRunning = false;

function isBookingAllowed(waktuBerangkat) {
  const now = new Date();
  const departure = new Date(waktuBerangkat);
  const timeDiff = departure - now;
  const minutesDiff = Math.floor(timeDiff / (1000 * 60));
  
  return minutesDiff > 10;
}

async function cleanupExpiredReservations() {
  try {
    const expiredReservations = await ReservasiSementara.findAll({
      where: {
        waktu_expired: {
          [Op.lt]: new Date()
        }
      },
      include: [
        {
          model: Rute,
          attributes: ['asal', 'tujuan']
        }
      ]
    });

    if (expiredReservations.length > 0) {
      const deletedCount = await ReservasiSementara.destroy({
        where: {
          waktu_expired: {
            [Op.lt]: new Date()
          }
        }
      });

      return {
        success: true,
        deletedCount: deletedCount
      };
    }

    return {
      success: true,
      deletedCount: 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function cleanupExpiredTickets() {
  try {
    // UBAH: 10 menit setelah batas_pembayaran, bukan waktu sekarang
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - (10 * 60 * 1000));
    
    const expiredTickets = await Tiket.findAll({
      where: {
        status_tiket: 'pending',
        batas_pembayaran: {
          [Op.lt]: tenMinutesAgo // 10 menit setelah batas_pembayaran
        }
      },
      include: [
        {
          model: Rute,
          attributes: ['asal', 'tujuan']
        }
      ]
    });

    if (expiredTickets.length > 0) {
      const updatedCount = await Tiket.update(
        { status_tiket: 'expired' },
        {
          where: {
            status_tiket: 'pending',
            batas_pembayaran: {
              [Op.lt]: tenMinutesAgo
            }
          }
        }
      );

      return {
        success: true,
        updatedCount: updatedCount[0]
      };
    }

    return {
      success: true,
      updatedCount: 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateCompletedTickets() {
  try {
    // Find confirmed tickets where bus has departed 15+ minutes ago
    const ticketsToComplete = await Tiket.findAll({
      where: {
        status_tiket: 'confirmed'
      },
      include: [
        {
          model: Rute,
          attributes: ['id_rute', 'asal', 'tujuan', 'waktu_berangkat'],
          where: {
            // Bus departed more than 15 minutes ago
            waktu_berangkat: {
              [Op.lt]: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
            }
          }
        }
      ]
    });

    if (ticketsToComplete.length > 0) {
      // Get all ticket IDs to update
      const ticketIds = ticketsToComplete.map(ticket => ticket.id_tiket);
      
      // Update tickets to completed status
      const updatedCount = await Tiket.update(
        { status_tiket: 'completed' },
        {
          where: {
            id_tiket: {
              [Op.in]: ticketIds
            },
            status_tiket: 'confirmed'
          }
        }
      );

      return {
        success: true,
        updatedCount: updatedCount[0]
      };
    }

    return {
      success: true,
      updatedCount: 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runCleanupTasks() {
  if (isCleanupJobRunning) {
    return;
  }

  isCleanupJobRunning = true;
  
  try {
    // Run all cleanup tasks
    const [reservationResult, ticketResult, completedResult] = await Promise.all([
      cleanupExpiredReservations(),
      cleanupExpiredTickets(),
      updateCompletedTickets()
    ]);

    return {
      success: true,
      results: {
        reservations: reservationResult,
        tickets: ticketResult,
        completed: completedResult
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    isCleanupJobRunning = false;
  }
}

function startCleanupJob() {
  const task = cron.schedule('* * * * *', async () => {
    await runCleanupTasks();
  }, {
    scheduled: false,
    timezone: 'Asia/Jakarta'
  });

  task.start();
  
  // Run immediately on startup
  setTimeout(async () => {
    await runCleanupTasks();
  }, 5000); // Wait 5 seconds after startup

  return task;
}

function stopCleanupJob() {
  if (global.cleanupTask) {
    global.cleanupTask.stop();
    global.cleanupTask = null;
  }
}

// Export functions
module.exports = {
  isBookingAllowed,
  cleanupExpiredReservations,
  cleanupExpiredTickets,
  updateCompletedTickets,
  runCleanupTasks,
  startCleanupJob,
  stopCleanupJob
};