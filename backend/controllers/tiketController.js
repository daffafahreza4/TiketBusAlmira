const { Tiket, User, Rute, Pembayaran, Bus, ReservasiSementara } = require('../models');
const { isBookingAllowed } = require('../utils/cleanupJob');
const { Op } = require('sequelize');

// Get all tickets for authenticated user
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Tiket.findAll({
      where: {
        id_user: req.user.id_user
      },
      include: [
        {
          model: User,
          attributes: ['id_user', 'username', 'email', 'no_telepon']
        },
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
          model: Pembayaran
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Transform data to ensure consistent structure
    const transformedTickets = tickets.map(ticket => {
      const ticketData = ticket.toJSON();

      // Ensure rute property exists (lowercase for frontend consistency)
      if (ticketData.Rute && !ticketData.rute) {
        ticketData.rute = {
          ...ticketData.Rute,
          nama_bus: ticketData.Rute.Bus?.nama_bus || 'N/A',
          total_kursi: ticketData.Rute.Bus?.total_kursi || 0
        };
      }

      // Ensure user property exists (lowercase for frontend consistency)
      if (ticketData.User && !ticketData.user) {
        ticketData.user = ticketData.User;
      }

      // Ensure pembayaran property exists (lowercase for frontend consistency)
      if (ticketData.Pembayaran && !ticketData.pembayaran) {
        ticketData.pembayaran = ticketData.Pembayaran;
      }

      return ticketData;
    });

    console.log('Transformed tickets structure:', {
      count: transformedTickets.length,
      sampleStructure: transformedTickets[0] ? {
        id_tiket: transformedTickets[0].id_tiket,
        hasRute: !!transformedTickets[0].rute,
        hasRuteAsal: !!transformedTickets[0].rute?.asal,
        hasUser: !!transformedTickets[0].user,
        hasPembayaran: !!transformedTickets[0].pembayaran
      } : 'No tickets'
    });

    res.status(200).json({
      success: true,
      count: transformedTickets.length,
      data: transformedTickets
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get ticket by ID for authenticated user
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Tiket.findOne({
      where: {
        id_tiket: req.params.id,
        id_user: req.user.id_user
      },
      include: [
        {
          model: User,
          attributes: ['id_user', 'username', 'email', 'no_telepon']
        },
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
          model: Pembayaran
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get grouped ticket by ID (NEW FUNCTION)
exports.getGroupedTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the main ticket
    const mainTicket = await Tiket.findOne({
      where: {
        id_tiket: id,
        id_user: req.user.id_user
      },
      include: [
        {
          model: User,
          attributes: ['id_user', 'username', 'email', 'no_telepon']
        },
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
          model: Pembayaran
        }
      ]
    });

    if (!mainTicket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    // Find grouped tickets (same booking session)
    const timeWindow = 2 * 60 * 1000; // 2 minutes window
    const bookingTime = new Date(mainTicket.tanggal_pemesanan);
    const startTime = new Date(bookingTime.getTime() - timeWindow);
    const endTime = new Date(bookingTime.getTime() + timeWindow);

    const groupedTickets = await Tiket.findAll({
      where: {
        id_user: req.user.id_user,
        id_rute: mainTicket.id_rute,
        tanggal_pemesanan: {
          [Op.between]: [startTime, endTime]
        }
      },
      include: [
        {
          model: User,
          attributes: ['id_user', 'username', 'email', 'no_telepon']
        },
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
          model: Pembayaran
        }
      ],
      order: [['nomor_kursi', 'ASC']]
    });

    // Combine data
    const allSeats = groupedTickets.map(ticket => ticket.nomor_kursi).sort();
    const totalPayment = groupedTickets.reduce((sum, ticket) => sum + parseFloat(ticket.total_bayar || 0), 0);

    // Create combined response
    const combinedTicket = {
      ...mainTicket.toJSON(),
      nomor_kursi: allSeats,
      total_bayar: totalPayment,
      ticket_count: groupedTickets.length,
      is_grouped: groupedTickets.length > 1,
      all_ticket_ids: groupedTickets.map(t => t.id_tiket)
    };

    res.status(200).json({
      success: true,
      data: combinedTicket
    });

  } catch (error) {
    console.error('Get grouped ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get available seats for a route (Enhanced with reservation check)
exports.getAvailableSeats = async (req, res) => {
  try {
    const { routeId } = req.params;

    // Get route and bus information
    const route = await Rute.findByPk(routeId, {
      include: [{
        model: Bus,
        attributes: ['nama_bus', 'total_kursi']
      }]
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }

    if (!isBookingAllowed(route.waktu_berangkat)) {
      const departure = new Date(route.waktu_berangkat);
      const now = new Date();

      let message = 'Pemesanan ditutup 10 menit sebelum keberangkatan.';
      if (departure <= now) {
        message = 'Bus sudah berangkat. Pemesanan tidak dapat dilakukan.';
      }

      return res.status(400).json({
        success: false,
        message: message,
        booking_closed: true
      });
    }


    // Get booked seats from confirmed tickets
    const bookedSeats = await Tiket.findAll({
      where: {
        id_rute: routeId,
        status_tiket: {
          [Op.in]: ['pending', 'confirmed', 'completed']
        }
      },
      attributes: ['nomor_kursi']
    });

    // Get reserved seats (temporary reservations that haven't expired)
    const reservedSeats = await ReservasiSementara.findAll({
      where: {
        id_rute: routeId,
        waktu_expired: {
          [Op.gt]: new Date() // Not expired yet
        }
      },
      attributes: ['nomor_kursi', 'id_user', 'waktu_expired']
    });

    const totalSeats = route.Bus.total_kursi; // Ambil dari database
    const seatsPerRow = 4;
    const totalRows = Math.ceil(totalSeats / seatsPerRow);

    // Generate seats berdasarkan kapasitas bus sebenarnya
    const allSeats = [];
    for (let seatNum = 1; seatNum <= totalSeats; seatNum++) { // Gunakan totalSeats, bukan 40
      const row = Math.ceil(seatNum / 4);
      const positionInRow = ((seatNum - 1) % 4) + 1;
      let seatPosition;

      if (positionInRow <= 2) {
        seatPosition = positionInRow === 1 ? 'window-left' : 'aisle-left';
      } else {
        seatPosition = positionInRow === 3 ? 'aisle-right' : 'window-right';
      }

      allSeats.push({
        number: seatNum.toString(),
        row: row,
        position: seatPosition,
        status: 'available'
      });
    }

    // Mark booked seats
    const bookedSeatNumbers = bookedSeats.map(seat => seat.nomor_kursi);

    // Mark reserved seats
    const reservedSeatInfo = reservedSeats.reduce((acc, seat) => {
      acc[seat.nomor_kursi] = {
        isMyReservation: seat.id_user === req.user?.id_user,
        expiredAt: seat.waktu_expired
      };
      return acc;
    }, {});

    // Update seat statuses
    const seatsWithStatus = allSeats.map(seat => {
      if (bookedSeatNumbers.includes(seat.number)) {
        return { ...seat, status: 'booked' };
      } else if (reservedSeatInfo[seat.number]) {
        const reservationInfo = reservedSeatInfo[seat.number];
        // SEMUA reservasi (termasuk my_reservation) = 'booked' untuk frontend
        return {
          ...seat,
          status: 'booked', // Ubah dari 'reserved'/'my_reservation' jadi 'booked'
          expiredAt: reservationInfo.expiredAt
        };
      }
      return { ...seat, status: 'available' };
    });

    // Calculate statistics
    const availableCount = seatsWithStatus.filter(seat => seat.status === 'available').length;
    const bookedCount = seatsWithStatus.filter(seat => seat.status === 'booked').length;
    const reservedCount = seatsWithStatus.filter(seat => seat.status === 'reserved').length;
    const myReservationCount = seatsWithStatus.filter(seat => seat.status === 'my_reservation').length;

    // PERBAIKAN: Enhanced response structure
    res.status(200).json({
      success: true,
      data: {
        routeId,
        busName: route.Bus.nama_bus,
        totalSeats,
        seats: seatsWithStatus,
        statistics: {
          available: availableCount,
          booked: bookedCount,
          reserved: reservedCount,
          my_reservations: myReservationCount
        },
        seatLayout: {
          rows: totalRows,
          seatsPerRow: seatsPerRow
        },
        // TAMBAH: Format yang mudah di-parse frontend
        seatStatuses: seatsWithStatus.reduce((acc, seat) => {
          acc[seat.number] = seat.status;
          return acc;
        }, {}),
        // TAMBAH: Array sederhana untuk backward compatibility
        availableSeats: seatsWithStatus
          .filter(seat => seat.status === 'available')
          .map(seat => seat.number)
      }
    });

  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Tambahkan fungsi untuk check real-time seat availability
exports.checkSeatAvailability = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { seats } = req.body; // Array of seats to check

    if (!seats || !Array.isArray(seats)) {
      return res.status(400).json({
        success: false,
        message: 'Seats array is required'
      });
    }

    // Check booked seats from tickets
    const bookedSeats = await Tiket.findAll({
      where: {
        id_rute: routeId,
        nomor_kursi: {
          [Op.in]: seats
        },
        status_tiket: {
          [Op.in]: ['pending', 'confirmed', 'completed']
        }
      },
      attributes: ['nomor_kursi']
    });

    // Check reserved seats (active reservations)
    const reservedSeats = await ReservasiSementara.findAll({
      where: {
        id_rute: routeId,
        nomor_kursi: {
          [Op.in]: seats
        },
        waktu_expired: {
          [Op.gt]: new Date()
        }
      },
      attributes: ['nomor_kursi', 'id_user']
    });

    const bookedSeatNumbers = bookedSeats.map(seat => seat.nomor_kursi);
    const reservedSeatNumbers = reservedSeats
      .filter(seat => seat.id_user !== req.user?.id_user)
      .map(seat => seat.nomor_kursi);

    // PERBAIKAN: Fix variable reference dan logic
    const unavailableSeats = [...bookedSeatNumbers, ...reservedSeatNumbers];
    const conflictSeats = seats.filter(seat => unavailableSeats.includes(seat));

    res.status(200).json({
      success: true,
      data: {
        available: conflictSeats.length === 0,
        conflictSeats,
        requestedSeats: seats,
        bookedSeats: bookedSeatNumbers,
        reservedSeats: reservedSeatNumbers
      }
    });

  } catch (error) {
    console.error('Check seat availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Cancel ticket (before departure)
// Cancel ticket (before departure) - Perbaikan
exports.cancelTicket = async (req, res) => {
  try {
    const ticket = await Tiket.findOne({
      where: {
        id_tiket: req.params.id,
        id_user: req.user.id_user
      },
      include: [
        {
          model: Rute,
          attributes: ['asal', 'tujuan', 'waktu_berangkat']
        },
        {
          model: Pembayaran
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    // Check if ticket can be cancelled
    if (ticket.status_tiket === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Tiket sudah dibatalkan'
      });
    }

    if (ticket.status_tiket === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Tiket yang sudah selesai tidak dapat dibatalkan'
      });
    }

    if (ticket.status_tiket === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Tiket sudah kadaluarsa'
      });
    }

    // Check if departure time has passed - Lebih toleran untuk testing
    const now = new Date();
    const departureTime = new Date(ticket.Rute.waktu_berangkat);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 0) { // Sudah berangkat
      return res.status(400).json({
        success: false,
        message: 'Tiket tidak dapat dibatalkan setelah waktu keberangkatan'
      });
    }

    // Update ticket status
    ticket.status_tiket = 'cancelled';
    await ticket.save();

    // Update payment status if exists
    if (ticket.Pembayaran) {
      ticket.Pembayaran.status = 'cancelled';
      await ticket.Pembayaran.save();
    }

    res.status(200).json({
      success: true,
      message: 'Tiket berhasil dibatalkan',
      data: {
        id_tiket: ticket.id_tiket,
        nomor_kursi: ticket.nomor_kursi,
        status_tiket: ticket.status_tiket,
        refund_eligible: ticket.Pembayaran?.status === 'completed',
        route: `${ticket.Rute.asal} → ${ticket.Rute.tujuan}`,
        departure_time: ticket.Rute.waktu_berangkat
      }
    });

  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};