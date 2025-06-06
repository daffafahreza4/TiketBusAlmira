const { ReservasiSementara, Rute, User, Bus, Tiket } = require('../models');
const { Op } = require('sequelize');

// Create temporary reservation (hold seat for 1 hour)
exports.createTempReservation = async (req, res) => {
  try {
    const { id_rute, nomor_kursi } = req.body;

    // Validate required fields
    if (!id_rute || !nomor_kursi || !Array.isArray(nomor_kursi) || nomor_kursi.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID rute dan nomor kursi harus diisi'
      });
    }

    // Check if route exists
    const rute = await Rute.findByPk(id_rute, {
      include: [{
        model: Bus,
        attributes: ['nama_bus', 'total_kursi']
      }]
    });

    if (!rute) {
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }

    // Set expiration time (1 hour from now)
    const waktu_expired = new Date(Date.now() + (30 * 60 * 1000)); // 30 minutes

    // Check for existing reservations and confirmed tickets for these seats
    const existingReservations = await ReservasiSementara.findAll({
      where: {
        id_rute,
        nomor_kursi: {
          [Op.in]: nomor_kursi
        },
        waktu_expired: {
          [Op.gt]: new Date() // Not expired yet
        }
      }
    });

    const existingTickets = await Tiket.findAll({
      where: {
        id_rute,
        nomor_kursi: {
          [Op.in]: nomor_kursi
        },
        status_tiket: {
          [Op.in]: ['pending', 'confirmed', 'completed']
        }
      }
    });

    // Check for seat conflicts
    const reservedSeats = existingReservations.map(res => res.nomor_kursi);
    const bookedSeats = existingTickets.map(ticket => ticket.nomor_kursi);
    const unavailableSeats = [...reservedSeats, ...bookedSeats];
    
    const conflictSeats = nomor_kursi.filter(seat => unavailableSeats.includes(seat));
    
    if (conflictSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Kursi ${conflictSeats.join(', ')} sudah dipesan atau direservasi oleh pengguna lain`,
        conflictSeats
      });
    }

    // Cancel any existing reservations by this user for this route
    await ReservasiSementara.destroy({
      where: {
        id_user: req.user.id_user,
        id_rute
      }
    });

    // Create new reservations for each seat
    const reservations = [];
    for (const seat of nomor_kursi) {
      const reservation = await ReservasiSementara.create({
        id_rute,
        id_user: req.user.id_user,
        nomor_kursi: seat,
        waktu_reservasi: new Date(),
        waktu_expired
      });
      reservations.push(reservation);
    }

    res.status(201).json({
      success: true,
      message: 'Kursi berhasil direservasi sementara',
      data: {
        reservations,
        route: rute,
        expiredAt: waktu_expired,
        reservedSeats: nomor_kursi
      }
    });

  } catch (error) {
    console.error('Create temp reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat reservasi'
    });
  }
};

// Get all user reservations
exports.getUserReservations = async (req, res) => {
  try {
    const reservations = await ReservasiSementara.findAll({
      where: {
        id_user: req.user.id_user,
        waktu_expired: {
          [Op.gt]: new Date() // Only non-expired reservations
        }
      },
      include: [
        {
          model: Rute,
          include: [
            {
              model: Bus,
              attributes: ['nama_bus', 'total_kursi']
            }
          ]
        },
        {
          model: User,
          attributes: ['id_user', 'username', 'email']
        }
      ],
      order: [['waktu_reservasi', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });

  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data reservasi'
    });
  }
};

// Get specific reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await ReservasiSementara.findOne({
      where: {
        id_reservasi: req.params.id,
        id_user: req.user.id_user // Ensure user can only access their own reservations
      },
      include: [
        {
          model: Rute,
          include: [
            {
              model: Bus,
              attributes: ['nama_bus', 'total_kursi']
            }
          ]
        },
        {
          model: User,
          attributes: ['id_user', 'username', 'email']
        }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservasi tidak ditemukan'
      });
    }

    // Check if reservation has expired
    if (new Date() > reservation.waktu_expired) {
      // Clean up expired reservation
      await reservation.destroy();
      
      return res.status(410).json({
        success: false,
        message: 'Reservasi telah kadaluarsa',
        expired: true
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data reservasi'
    });
  }
};

// Cancel reservation manually
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await ReservasiSementara.findOne({
      where: {
        id_reservasi: req.params.id,
        id_user: req.user.id_user // Ensure user can only cancel their own reservations
      },
      include: [
        {
          model: Rute,
          attributes: ['asal', 'tujuan', 'waktu_berangkat']
        }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservasi tidak ditemukan'
      });
    }

    // Store reservation data before deletion for response
    const reservationData = {
      id_reservasi: reservation.id_reservasi,
      nomor_kursi: reservation.nomor_kursi,
      rute: reservation.Rute
    };

    // Delete the reservation
    await reservation.destroy();

    res.status(200).json({
      success: true,
      message: `Reservasi kursi ${reservation.nomor_kursi} berhasil dibatalkan`,
      data: reservationData
    });

  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membatalkan reservasi'
    });
  }
};

// Check and cleanup expired reservations
exports.checkExpiredReservations = async () => {
  try {
    const expiredReservations = await ReservasiSementara.findAll({
      where: {
        waktu_expired: {
          [Op.lt]: new Date() // Expired reservations
        }
      },
      include: [
        {
          model: Rute,
          attributes: ['asal', 'tujuan']
        },
        {
          model: User,
          attributes: ['username', 'email']
        }
      ]
    });

    if (expiredReservations.length > 0) {
      // Delete all expired reservations
      const deletedCount = await ReservasiSementara.destroy({
        where: {
          waktu_expired: {
            [Op.lt]: new Date()
          }
        }
      });

      return {
        success: true,
        deletedCount,
        expiredReservations: expiredReservations.map(res => ({
          id_reservasi: res.id_reservasi,
          nomor_kursi: res.nomor_kursi,
          user: res.User?.username,
          route: `${res.Rute?.asal} → ${res.Rute?.tujuan}`
        }))
      };
    } else {
      return {
        success: true,
        deletedCount: 0,
        expiredReservations: []
      };
    }

  } catch (error) {
    console.error('Check expired reservations error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all reservations for a specific route (useful for checking seat availability)
exports.getRouteReservations = async (req, res) => {
  try {
    const { routeId } = req.params;

    const reservations = await ReservasiSementara.findAll({
      where: {
        id_rute: routeId,
        waktu_expired: {
          [Op.gt]: new Date() // Only active reservations
        }
      },
      attributes: ['nomor_kursi', 'waktu_expired'],
      include: [
        {
          model: User,
          attributes: ['username']
        }
      ]
    });

    const reservedSeats = reservations.map(res => res.nomor_kursi);

    res.status(200).json({
      success: true,
      data: {
        routeId,
        reservedSeats,
        reservations
      }
    });

  } catch (error) {
    console.error('Get route reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data reservasi rute'
    });
  }
};