const { Tiket, User, Rute, Pembayaran, Bus, ReservasiSementara } = require('../models');
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

    console.log('✅ [getMyTickets] Transformed tickets structure:', {
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
    console.error('❌ [getMyTickets] Error:', error);
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
              attributes: ['nama_bus', 'total_kursi' ]
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
    
    const totalSeats = route.Bus.total_kursi;
    const seatsPerRow = 4; // Assuming 4 seats per row (A, B, C, D)
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    
    // Generate all possible seats
    const allSeats = [];
    for (let row = 1; row <= totalRows; row++) {
      const seatsInRow = Math.min(seatsPerRow, totalSeats - allSeats.length);
      const seatLetters = ['A', 'B', 'C', 'D'];
      
      for (let i = 0; i < seatsInRow; i++) {
        allSeats.push({
          number: `${row}${seatLetters[i]}`,
          row: row,
          position: seatLetters[i],
          status: 'available'
        });
      }
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
        return { 
          ...seat, 
          status: reservationInfo.isMyReservation ? 'my_reservation' : 'reserved',
          expiredAt: reservationInfo.expiredAt
        };
      }
      return seat;
    });

    // Calculate statistics
    const availableCount = seatsWithStatus.filter(seat => seat.status === 'available').length;
    const bookedCount = seatsWithStatus.filter(seat => seat.status === 'booked').length;
    const reservedCount = seatsWithStatus.filter(seat => seat.status === 'reserved').length;
    const myReservationCount = seatsWithStatus.filter(seat => seat.status === 'my_reservation').length;

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
        }
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

// Cancel ticket (before departure)
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

    // Check if departure time has passed
    const now = new Date();
    const departureTime = new Date(ticket.Rute.waktu_berangkat);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 2) { // Cannot cancel within 2 hours of departure
      return res.status(400).json({
        success: false,
        message: 'Tiket tidak dapat dibatalkan dalam 2 jam sebelum keberangkatan'
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
        refund_eligible: ticket.Pembayaran?.status === 'completed'
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