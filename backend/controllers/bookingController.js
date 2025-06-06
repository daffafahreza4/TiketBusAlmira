const { Tiket, User, Rute, Bus, ReservasiSementara, Pembayaran } = require('../models');
const { isBookingAllowed } = require('../utils/cleanupJob');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

// ============= HELPER FUNCTIONS =============

/**
 * Generate unique payment code
 */
function generatePaymentCode() {
  return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Set payment deadline (24 hours from now)
 */
function getPaymentDeadline() {
  return new Date(Date.now() + (30 * 60 * 1000));
}

/**
 * Get complete ticket data with all relations
 */
async function getCompleteTicketData(id_tiket) {
  return await Tiket.findByPk(id_tiket, {
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
}

/**
 * Get multiple complete ticket data
 */
async function getMultipleCompleteTicketData(ticketIds) {
  return await Promise.all(
    ticketIds.map(id => getCompleteTicketData(id))
  );
}

/**
 * Check if route exists and return route data
 */
async function validateAndGetRoute(id_rute, transaction) {
  const rute = await Rute.findByPk(id_rute, {
    include: [{
      model: Bus,
      attributes: ['nama_bus', 'total_kursi']
    }],
    transaction
  });

  if (!rute) {
    throw new Error('Rute tidak ditemukan');
  }

  // TAMBAH: Validasi waktu keberangkatan
  if (!isBookingAllowed(rute.waktu_berangkat)) {
    const departure = new Date(rute.waktu_berangkat);
    const now = new Date();

    if (departure <= now) {
      throw new Error('Bus sudah berangkat. Pemesanan tidak dapat dilakukan.');
    } else {
      throw new Error('Pemesanan ditutup 10 menit sebelum keberangkatan.');
    }
  }

  return rute;
}

/**
 * Check seat availability for single or multiple seats
 */
async function checkSeatAvailability(id_rute, nomor_kursi, id_user, transaction) {
  const seats = Array.isArray(nomor_kursi) ? nomor_kursi : [nomor_kursi];

  const [existingTickets, existingReservations] = await Promise.all([
    // Check existing tickets
    Tiket.findAll({
      where: {
        id_rute,
        nomor_kursi: {
          [Op.in]: seats
        },
        status_tiket: {
          [Op.in]: ['pending', 'confirmed', 'completed']
        }
      },
      transaction
    }),
    // Check active reservations (exclude current user)
    ReservasiSementara.findAll({
      where: {
        id_rute,
        nomor_kursi: {
          [Op.in]: seats
        },
        waktu_expired: {
          [Op.gt]: new Date()
        },
        id_user: {
          [Op.ne]: id_user
        }
      },
      transaction
    })
  ]);

  const bookedSeats = existingTickets.map(ticket => ticket.nomor_kursi);
  const reservedSeats = existingReservations.map(res => res.nomor_kursi);
  const unavailableSeats = [...bookedSeats, ...reservedSeats];

  const conflictSeats = seats.filter(seat => unavailableSeats.includes(seat));

  if (conflictSeats.length > 0) {
    const error = new Error(`Kursi ${conflictSeats.join(', ')} sudah dipesan atau direservasi oleh pengguna lain`);
    error.conflictSeats = conflictSeats;
    throw error;
  }

  return true;
}

/**
 * Create single ticket with payment record
 */
async function createTicketWithPayment(ticketData, metode_pembayaran, transaction) {
  const batas_pembayaran = getPaymentDeadline();

  // Create ticket
  const ticket = await Tiket.create({
    ...ticketData,
    tanggal_pemesanan: new Date(),
    status_tiket: 'pending',
    batas_pembayaran
  }, { transaction });

  // Generate payment code
  const kode_pembayaran = generatePaymentCode();

  // Create payment record
  const payment = await Pembayaran.create({
    id_tiket: ticket.id_tiket,
    metode: metode_pembayaran,
    status: 'pending',
    kode_pembayaran,
    transaction_id: null,
    payment_token: null,
    snap_redirect_url: null
  }, { transaction });

  return { ticket, payment };
}

/**
 * Create multiple tickets for multiple seats
 */
async function createMultipleTicketsWithPayments(baseTicketData, seats, metode_pembayaran, transaction) {
  const tickets = [];
  const payments = [];

  for (const seat of seats) {
    const ticketData = {
      ...baseTicketData,
      nomor_kursi: seat
    };

    const { ticket, payment } = await createTicketWithPayment(ticketData, metode_pembayaran, transaction);
    tickets.push(ticket);
    payments.push(payment);
  }

  return { tickets, payments };
}

/**
 * Clear user's reservations for specific seats
 */
async function clearUserReservations(id_user, id_rute, nomor_kursi, transaction) {
  const seats = Array.isArray(nomor_kursi) ? nomor_kursi : [nomor_kursi];

  await ReservasiSementara.destroy({
    where: {
      id_user,
      id_rute,
      nomor_kursi: {
        [Op.in]: seats
      }
    },
    transaction
  });
}

/**
 * Validate reservation and check expiry
 */
async function validateReservation(id_reservasi, id_user, transaction) {
  const reservation = await ReservasiSementara.findOne({
    where: {
      id_reservasi,
      id_user
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
      }
    ],
    transaction
  });

  if (!reservation) {
    throw new Error('Reservasi tidak ditemukan atau telah kadaluarsa');
  }

  // Check if reservation is still valid (not expired)
  if (new Date() > reservation.waktu_expired) {
    await reservation.destroy({ transaction });
    const error = new Error('Reservasi telah kadaluarsa. Silakan pilih kursi kembali.');
    error.expired = true;
    throw error;
  }

  return reservation;
}

/**
 * Format success response for ticket creation
 */
function formatTicketResponse(tickets, payments, isMultiple = false) {
  const firstTicket = Array.isArray(tickets) ? tickets[0] : tickets;
  const totalAmount = Array.isArray(tickets)
    ? tickets.reduce((sum, ticket) => sum + parseFloat(ticket.total_bayar), 0)
    : parseFloat(tickets.total_bayar);

  const response = {
    success: true,
    message: isMultiple
      ? `${tickets.length} tiket berhasil dibuat. Lanjutkan ke pembayaran.`
      : 'Tiket berhasil dibuat. Lanjutkan ke pembayaran.',
    data: {
      [isMultiple ? 'tickets' : 'ticket']: isMultiple ? tickets : tickets,
      [isMultiple ? 'payments' : 'payment']: isMultiple ?
        payments.map(payment => ({
          kode_pembayaran: payment.kode_pembayaran,
          metode: payment.metode,
          batas_pembayaran: firstTicket.batas_pembayaran,
          total_bayar: totalAmount,
          status: 'pending'
        })) : {
          kode_pembayaran: payments.kode_pembayaran,
          metode: payments.metode,
          batas_pembayaran: firstTicket.batas_pembayaran,
          total_bayar: totalAmount,
          status: 'pending'
        },
      next_steps: {
        create_payment_token: `/api/pembayaran/create`,
        check_status: `/api/pembayaran/status/${firstTicket.id_tiket}`,
        cancel_payment: `/api/pembayaran/cancel/${firstTicket.id_tiket}`
      }
    }
  };

  return response;
}

// ============= MAIN CONTROLLER FUNCTIONS =============

/**
 * Create ticket from reservation with automatic Midtrans integration
 */
exports.createTicketFromReservation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_reservasi, metode_pembayaran = 'midtrans', nomor_kursi, id_rute } = req.body;

    console.log('Request body:', req.body);

    // Handle temporary reservation (when id_reservasi is 'temp')
    if (id_reservasi === 'temp' && nomor_kursi && id_rute) {
      console.log('Creating ticket directly without reservation');

      // Validate required fields
      if (!id_rute || !nomor_kursi || !Array.isArray(nomor_kursi) || nomor_kursi.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'ID rute dan nomor kursi harus diisi'
        });
      }

      try {
        // Validate route
        const rute = await validateAndGetRoute(id_rute, transaction);

        // Check seat availability
        await checkSeatAvailability(id_rute, nomor_kursi, req.user.id_user, transaction);

        // Create tickets for each seat
        const baseTicketData = {
          id_rute,
          id_user: req.user.id_user,
          total_bayar: rute.harga
        };

        const { tickets, payments } = await createMultipleTicketsWithPayments(
          baseTicketData,
          nomor_kursi,
          metode_pembayaran,
          transaction
        );

        // Clear any existing reservations by this user for these seats
        await clearUserReservations(req.user.id_user, id_rute, nomor_kursi, transaction);

        await transaction.commit();

        // Get complete ticket data for response
        const completeTickets = await getMultipleCompleteTicketData(
          tickets.map(t => t.id_tiket)
        );

        console.log('Multiple tickets created successfully');

        return res.status(201).json(formatTicketResponse(completeTickets, payments, true));

      } catch (error) {
        await transaction.rollback();

        if (error.conflictSeats) {
          return res.status(409).json({
            success: false,
            message: error.message,
            conflictSeats: error.conflictSeats
          });
        }

        return res.status(error.message === 'Rute tidak ditemukan' ? 404 : 500).json({
          success: false,
          message: error.message
        });
      }
    }

    // Original logic for actual reservations
    if (!id_reservasi || id_reservasi === 'temp') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID reservasi harus diisi'
      });
    }

    try {
      // Validate reservation
      const reservation = await validateReservation(id_reservasi, req.user.id_user, transaction);

      // Check if seat is already booked by someone else
      await checkSeatAvailability(
        reservation.id_rute,
        reservation.nomor_kursi,
        req.user.id_user,
        transaction
      );

      // Create ticket
      const ticketData = {
        id_rute: reservation.id_rute,
        id_user: req.user.id_user,
        nomor_kursi: reservation.nomor_kursi,
        total_bayar: reservation.Rute.harga
      };

      const { ticket, payment } = await createTicketWithPayment(ticketData, metode_pembayaran, transaction);

      // Delete the reservation (convert to ticket)
      await reservation.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      // Get complete ticket data for response
      const completeTicket = await getCompleteTicketData(ticket.id_tiket);

      console.log('Ticket created from reservation successfully');

      res.status(201).json(formatTicketResponse(completeTicket, payment, false));

    } catch (error) {
      await transaction.rollback();

      if (error.expired) {
        return res.status(410).json({
          success: false,
          message: error.message,
          expired: true
        });
      }

      if (error.conflictSeats) {
        return res.status(409).json({
          success: false,
          message: 'Kursi sudah dipesan oleh pengguna lain'
        });
      }

      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat tiket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Enhanced booking summary with payment information
 */
exports.getBookingSummary = async (req, res) => {
  try {
    const { id_reservasi } = req.params;

    const reservation = await ReservasiSementara.findOne({
      where: {
        id_reservasi,
        id_user: req.user.id_user
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
          attributes: ['username', 'email', 'no_telepon']
        }
      ]
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservasi tidak ditemukan'
      });
    }

    // Check if reservation is still valid
    if (new Date() > reservation.waktu_expired) {
      await reservation.destroy();

      return res.status(410).json({
        success: false,
        message: 'Reservasi telah kadaluarsa',
        expired: true
      });
    }

    // Calculate time remaining
    const timeRemaining = reservation.waktu_expired - new Date();
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

    // Calculate fees and total
    const basePrice = reservation.Rute.harga;
    const adminFee = 5000; // Admin fee (could be configurable)
    const totalPrice = basePrice + adminFee;

    const summary = {
      reservation: {
        id_reservasi: reservation.id_reservasi,
        nomor_kursi: reservation.nomor_kursi,
        waktu_expired: reservation.waktu_expired,
        minutes_remaining: minutesRemaining
      },
      route: {
        id_rute: reservation.Rute.id_rute,
        asal: reservation.Rute.asal,
        tujuan: reservation.Rute.tujuan,
        waktu_berangkat: reservation.Rute.waktu_berangkat,
        harga: reservation.Rute.harga
      },
      bus: {
        nama_bus: reservation.Rute.Bus.nama_bus,
        total_kursi: reservation.Rute.Bus.total_kursi
      },
      passenger: {
        username: reservation.User.username,
        email: reservation.User.email,
        no_telepon: reservation.User.no_telepon
      },
      pricing: {
        base_price: basePrice,
        admin_fee: adminFee,
        total_price: totalPrice
      },
      total_bayar: totalPrice,
      payment_methods: {
        midtrans: {
          available: true,
          types: ['credit_card', 'bank_transfer', 'e_wallet', 'convenience_store']
        }
      }
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil ringkasan booking'
    });
  }
};

/**
 * Complete booking with payment (legacy method for backward compatibility)
 */
exports.createTicket = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_rute, nomor_kursi, metode_pembayaran = 'midtrans' } = req.body;

    console.log('Request body:', req.body);

    // Validate required fields
    if (!id_rute || !nomor_kursi) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID rute dan nomor kursi harus diisi'
      });
    }

    // Normalize nomor_kursi to single seat for legacy compatibility
    const seatNumber = Array.isArray(nomor_kursi) ? nomor_kursi[0] : nomor_kursi;

    try {
      // Validate route
      const rute = await validateAndGetRoute(id_rute, transaction);

      // Check seat availability
      await checkSeatAvailability(id_rute, seatNumber, req.user.id_user, transaction);

      // Create ticket
      const ticketData = {
        id_rute,
        id_user: req.user.id_user,
        nomor_kursi: seatNumber,
        total_bayar: rute.harga
      };

      const { ticket, payment } = await createTicketWithPayment(ticketData, metode_pembayaran, transaction);

      // Clear any existing reservations by this user for this seat
      await clearUserReservations(req.user.id_user, id_rute, seatNumber, transaction);

      await transaction.commit();

      // Get complete ticket data for response
      const completeTicket = await getCompleteTicketData(ticket.id_tiket);

      console.log('Direct ticket created successfully');

      res.status(201).json(formatTicketResponse(completeTicket, payment, false));

    } catch (error) {
      await transaction.rollback();

      if (error.conflictSeats) {
        return res.status(409).json({
          success: false,
          message: 'Kursi sudah dipesan atau direservasi'
        });
      }

      return res.status(error.message === 'Rute tidak ditemukan' ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat tiket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get grouped tickets by ID
 */
exports.getGroupedTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the main ticket
    const mainTicket = await getCompleteTicketData(id);

    if (!mainTicket || mainTicket.id_user !== req.user.id_user) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    // Find all tickets with same booking time and route (group tickets)
    const groupedTickets = await Tiket.findAll({
      where: {
        id_user: req.user.id_user,
        id_rute: mainTicket.id_rute,
        tanggal_pemesanan: mainTicket.tanggal_pemesanan,
        status_tiket: mainTicket.status_tiket
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

    // Combine seat numbers and total payment
    const allSeats = groupedTickets.map(ticket => ticket.nomor_kursi);
    const totalPayment = groupedTickets.reduce((sum, ticket) => sum + parseFloat(ticket.total_bayar), 0);

    // Create combined ticket object
    const combinedTicket = {
      ...mainTicket.toJSON(),
      nomor_kursi: allSeats,
      total_bayar: totalPayment,
      ticket_count: groupedTickets.length,
      all_tickets: groupedTickets.map(t => t.toJSON())
    };

    res.status(200).json({
      success: true,
      data: combinedTicket
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};