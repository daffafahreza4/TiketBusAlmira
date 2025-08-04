const { Tiket, User, Rute, Pembayaran, Bus, ReservasiSementara } = require('../models');
const { sequelize } = require('../config/db');
const { isBookingAllowed } = require('../utils/cleanupJob');
const { Op } = require('sequelize');

// Get all tickets for authenticated user
exports.getMyTickets = async (req, res) => {
  try {
    const { status } = req.query; // TAMBAH: Query parameter untuk filter
    
    let whereClause = {
      id_user: req.user.id_user
    };
    
    // TAMBAH: Filter berdasarkan status termasuk expired
    if (status && status !== 'all') {
      if (status === 'expired') {
        // Filter untuk tiket expired
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - (10 * 60 * 1000));
        
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { status_tiket: 'expired' },
            {
              status_tiket: 'pending',
              batas_pembayaran: {
                [Op.lt]: tenMinutesAgo
              }
            }
          ]
        };
      } else {
        whereClause.status_tiket = status;
      }
    }

    const tickets = await Tiket.findAll({
      where: whereClause,
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

    // TAMBAH: Transform dan mark expired tickets
    const transformedTickets = tickets.map(ticket => {
      const ticketData = ticket.toJSON();
      
      // Check if ticket is expired
      if (ticketData.status_tiket === 'pending' && ticketData.batas_pembayaran) {
        const now = new Date();
        const batasPembayaran = new Date(ticketData.batas_pembayaran);
        const tenMinutesAfterDeadline = new Date(batasPembayaran.getTime() + (10 * 60 * 1000));
        
        if (now > tenMinutesAfterDeadline) {
          ticketData.status_tiket = 'expired';
        }
      }

      // Ensure lowercase properties for frontend consistency
      if (ticketData.Rute && !ticketData.rute) {
        ticketData.rute = {
          ...ticketData.Rute,
          nama_bus: ticketData.Rute.Bus?.nama_bus || 'N/A',
          total_kursi: ticketData.Rute.Bus?.total_kursi || 0
        };
      }

      if (ticketData.User && !ticketData.user) {
        ticketData.user = ticketData.User;
      }

      if (ticketData.Pembayaran && !ticketData.pembayaran) {
        ticketData.pembayaran = ticketData.Pembayaran;
      }

      return ticketData;
    });

    res.status(200).json({
      success: true,
      count: transformedTickets.length,
      data: transformedTickets
    });
  } catch (error) {
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
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get order (grouped tickets) by ticket ID or order group ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // First, try to get ticket by ID to find order group
    let referenceTicket = await Tiket.findOne({
      where: {
        [Op.or]: [
          { id_tiket: id },
          { order_group_id: id }
        ],
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

    if (!referenceTicket) {
      return res.status(404).json({
        success: false,
        message: 'Order atau tiket tidak ditemukan'
      });
    }

    // Get all tickets in the same order group
    let allTicketsInOrder;
    
    if (referenceTicket.order_group_id) {
      // NEW SYSTEM: Get by order_group_id
      allTicketsInOrder = await Tiket.findAll({
        where: {
          order_group_id: referenceTicket.order_group_id,
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
        order: [['nomor_kursi', 'ASC']]
      });
    } else {
      // LEGACY SYSTEM: Use time-based grouping for old tickets
      const timeWindow = 2 * 60 * 1000; // 2 minutes window
      const bookingTime = new Date(referenceTicket.tanggal_pemesanan);
      const startTime = new Date(bookingTime.getTime() - timeWindow);
      const endTime = new Date(bookingTime.getTime() + timeWindow);

      allTicketsInOrder = await Tiket.findAll({
        where: {
          id_user: req.user.id_user,
          id_rute: referenceTicket.id_rute,
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
    }

    // Find master ticket (either marked as master or first ticket)
    const masterTicket = allTicketsInOrder.find(t => t.is_master_ticket) || allTicketsInOrder[0];
    
    // Calculate totals
    const allSeats = allTicketsInOrder.map(ticket => ticket.nomor_kursi).sort();
    const totalOrderAmount = masterTicket.order_total_amount || 
      allTicketsInOrder.reduce((sum, ticket) => sum + parseFloat(ticket.total_bayar || 0), 0);

    // Determine overall order status
    const ticketStatuses = allTicketsInOrder.map(t => t.status_tiket);
    const orderStatus = (() => {
      if (ticketStatuses.every(status => status === 'confirmed')) return 'confirmed';
      if (ticketStatuses.every(status => status === 'cancelled')) return 'cancelled';
      if (ticketStatuses.some(status => status === 'pending')) return 'pending';
      return masterTicket.status_tiket; // fallback to master ticket status
    })();

    // Create order response
    const orderResponse = {
      // ORDER INFO
      order: {
        order_group_id: masterTicket.order_group_id || `LEGACY-${masterTicket.id_tiket}`,
        total_tickets: allTicketsInOrder.length,
        total_amount: totalOrderAmount,
        seats: allSeats,
        master_ticket_id: masterTicket.id_tiket,
        is_legacy_order: !masterTicket.order_group_id
      },
      
      // TICKETS DETAIL
      tickets: allTicketsInOrder.map(ticket => ({
        id_tiket: ticket.id_tiket,
        nomor_kursi: ticket.nomor_kursi,
        individual_price: parseFloat(ticket.total_bayar),
        status_tiket: ticket.status_tiket,
        is_master_ticket: ticket.is_master_ticket || (ticket.id_tiket === masterTicket.id_tiket),
        tanggal_pemesanan: ticket.tanggal_pemesanan,
        batas_pembayaran: ticket.batas_pembayaran
      })),
      
      // ROUTE INFO
      route: masterTicket.Rute ? {
        id_rute: masterTicket.Rute.id_rute,
        asal: masterTicket.Rute.asal,
        tujuan: masterTicket.Rute.tujuan,
        waktu_berangkat: masterTicket.Rute.waktu_berangkat,
        harga: masterTicket.Rute.harga,
        nama_bus: masterTicket.Rute.Bus ? masterTicket.Rute.Bus.nama_bus : 'Bus Tidak Diketahui',
        total_kursi: masterTicket.Rute.Bus ? masterTicket.Rute.Bus.total_kursi : 0,
        Bus: masterTicket.Rute.Bus,
        bus: masterTicket.Rute.Bus
      } : null,
      
      // PAYMENT INFO
      payment: masterTicket.Pembayaran || null,
      
      // USER INFO
      user: masterTicket.User ? {
        id_user: masterTicket.User.id_user,
        username: masterTicket.User.username,
        email: masterTicket.User.email
      } : null,
      
      // ORDER STATUS
      status_tiket: orderStatus,
      tanggal_pemesanan: masterTicket.tanggal_pemesanan,
      batas_pembayaran: masterTicket.batas_pembayaran
    };

    res.status(200).json({
      success: true,
      data: orderResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get available seats for a route (Enhanced with reservation check) - FIXED VERSION
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

    // PERBAIKAN: Get booked seats from confirmed/pending tickets
    const bookedSeats = await Tiket.findAll({
      where: {
        id_rute: routeId,
        status_tiket: {
          [Op.in]: ['pending', 'confirmed', 'completed']
        }
      },
      attributes: ['nomor_kursi']
    });

    // PERBAIKAN: Get reserved seats (temporary reservations that haven't expired)
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
    const seatsPerRow = 4;
    const totalRows = Math.ceil(totalSeats / seatsPerRow);

    // Generate seats berdasarkan kapasitas bus sebenarnya
    const allSeats = [];
    for (let seatNum = 1; seatNum <= totalSeats; seatNum++) {
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

    // PERBAIKAN: Mark booked seats (ensure all booked seats are marked)
    const bookedSeatNumbers = bookedSeats.map(seat => seat.nomor_kursi);

    // PERBAIKAN: Mark reserved seats (handle user's own reservations vs others)
    const reservedSeatInfo = reservedSeats.reduce((acc, seat) => {
      acc[seat.nomor_kursi] = {
        isMyReservation: seat.id_user === req.user?.id_user,
        expiredAt: seat.waktu_expired
      };
      return acc;
    }, {});

    // PERBAIKAN: Update seat statuses dengan logic yang benar
    const seatsWithStatus = allSeats.map(seat => {
      if (bookedSeatNumbers.includes(seat.number)) {
        return { ...seat, status: 'booked' };
      } else if (reservedSeatInfo[seat.number]) {
        const reservationInfo = reservedSeatInfo[seat.number];
        // Bedakan antara reservasi milik sendiri vs orang lain
        return {
          ...seat,
          status: reservationInfo.isMyReservation ? 'my_reservation' : 'reserved',
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

    // Enhanced response structure
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
        // Format yang mudah di-parse frontend
        seatStatuses: seatsWithStatus.reduce((acc, seat) => {
          acc[seat.number] = seat.status;
          return acc;
        }, {}),
        // Array sederhana untuk backward compatibility
        availableSeats: seatsWithStatus
          .filter(seat => seat.status === 'available')
          .map(seat => seat.number)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Check real-time seat availability - ENHANCED VERSION
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

    // TAMBAH: Validasi maksimal 5 kursi per check
    if (seats.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maksimal 5 kursi per pengecekan'
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
        reservedSeats: reservedSeatNumbers,
        maxSeatsPerBooking: 5
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Cancel ticket (before departure) - Enhanced Version
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

    // Check if departure time has passed
    const now = new Date();
    const departureTime = new Date(ticket.Rute.waktu_berangkat);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 0) { // Sudah berangkat
      return res.status(400).json({
        success: false,
        message: 'Tiket tidak dapat dibatalkan setelah waktu keberangkatan'
      });
    }

    // Use transaction to ensure all updates are atomic
    const transaction = await sequelize.transaction();

    try {
      // Update ticket status - HANDLE GROUPED TICKETS
      if (ticket.order_group_id) {
        // NEW SYSTEM: Cancel all tickets in the order group
        const updateResult = await Tiket.update(
          { 
            status_tiket: 'cancelled' 
          },
          {
            where: {
              order_group_id: ticket.order_group_id
            },
            transaction
          }
        );
      } else {
        // LEGACY SYSTEM: Cancel single ticket
        ticket.status_tiket = 'cancelled';
        await ticket.save({ transaction });
      }

      // Update payment status if exists
      if (ticket.Pembayaran) {
        ticket.Pembayaran.status = 'cancelled';
        await ticket.Pembayaran.save({ transaction });
      }

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
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
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};