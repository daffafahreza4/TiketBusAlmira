const { Tiket, User, Rute, Bus, ReservasiSementara, Pembayaran } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

// Create ticket from reservation with automatic Midtrans integration
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

      // Check if route exists
      const rute = await Rute.findByPk(id_rute, {
        include: [{
          model: Bus,
          attributes: ['nama_bus', 'total_kursi']
        }],
        transaction
      });

      if (!rute) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Rute tidak ditemukan'
        });
      }

      // Check if seats are available (not booked and not reserved)
      const seatChecks = await Promise.all([
        // Check existing tickets
        Tiket.findAll({
          where: {
            id_rute,
            nomor_kursi: {
              [Op.in]: nomor_kursi
            },
            status_tiket: {
              [Op.in]: ['pending', 'confirmed', 'completed']
            }
          },
          transaction
        }),
        // Check active reservations
        ReservasiSementara.findAll({
          where: {
            id_rute,
            nomor_kursi: {
              [Op.in]: nomor_kursi
            },
            waktu_expired: {
              [Op.gt]: new Date()
            },
            id_user: {
              [Op.ne]: req.user.id_user // Exclude current user's reservations
            }
          },
          transaction
        })
      ]);

      const [existingTickets, existingReservations] = seatChecks;
      const bookedSeats = existingTickets.map(ticket => ticket.nomor_kursi);
      const reservedSeats = existingReservations.map(res => res.nomor_kursi);
      const unavailableSeats = [...bookedSeats, ...reservedSeats];
      
      const conflictSeats = nomor_kursi.filter(seat => unavailableSeats.includes(seat));
      
      if (conflictSeats.length > 0) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Kursi ${conflictSeats.join(', ')} sudah dipesan atau direservasi oleh pengguna lain`,
          conflictSeats
        });
      }

      // Create tickets for each seat
      const tickets = [];
      const payments = [];

      for (const seat of nomor_kursi) {
        // Set payment deadline (24 hours from now)
        const batas_pembayaran = new Date(Date.now() + (24 * 60 * 60 * 1000));

        // Create ticket
        const ticket = await Tiket.create({
          id_rute,
          id_user: req.user.id_user,
          nomor_kursi: seat,
          tanggal_pemesanan: new Date(),
          status_tiket: 'pending',
          total_bayar: rute.harga,
          batas_pembayaran
        }, { transaction });

        // Generate payment code
        const kode_pembayaran = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

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

        tickets.push(ticket);
        payments.push(payment);
      }

      // Clear any existing reservations by this user for these seats
      await ReservasiSementara.destroy({
        where: {
          id_user: req.user.id_user,
          id_rute,
          nomor_kursi: {
            [Op.in]: nomor_kursi
          }
        },
        transaction
      });

      await transaction.commit();

      // Get complete ticket data for response
      const completeTickets = await Promise.all(
        tickets.map(ticket => 
          Tiket.findByPk(ticket.id_tiket, {
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
          })
        )
      );

      console.log('Multiple tickets created successfully');

      return res.status(201).json({
        success: true,
        message: `${tickets.length} tiket berhasil dibuat. Lanjutkan ke pembayaran.`,
        data: {
          tickets: completeTickets,
          payments: payments.map(payment => ({
            kode_pembayaran: payment.kode_pembayaran,
            metode: payment.metode,
            batas_pembayaran: tickets[0].batas_pembayaran,
            total_bayar: tickets.reduce((sum, ticket) => sum + parseFloat(ticket.total_bayar), 0),
            status: 'pending'
          })),
          next_steps: {
            create_payment_token: `/api/pembayaran/create`,
            check_status: `/api/pembayaran/status/${tickets[0].id_tiket}`,
            cancel_payment: `/api/pembayaran/cancel/${tickets[0].id_tiket}`
          }
        }
      });
    }

    // Original logic for actual reservations
    if (!id_reservasi || id_reservasi === 'temp') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID reservasi harus diisi'
      });
    }

    // Get reservation with route and bus details
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
        }
      ],
      transaction
    });

    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservasi tidak ditemukan atau telah kadaluarsa'
      });
    }

    // Check if reservation is still valid (not expired)
    if (new Date() > reservation.waktu_expired) {
      await reservation.destroy({ transaction });
      await transaction.rollback();
      
      return res.status(410).json({
        success: false,
        message: 'Reservasi telah kadaluarsa. Silakan pilih kursi kembali.',
        expired: true
      });
    }

    // Check if seat is already booked by someone else
    const existingTicket = await Tiket.findOne({
      where: {
        id_rute: reservation.id_rute,
        nomor_kursi: reservation.nomor_kursi,
        status_tiket: {
          [Op.in]: ['pending', 'confirmed', 'completed']
        }
      },
      transaction
    });

    if (existingTicket) {
      await reservation.destroy({ transaction });
      await transaction.rollback();
      
      return res.status(409).json({
        success: false,
        message: 'Kursi sudah dipesan oleh pengguna lain'
      });
    }

    // Set payment deadline (24 hours from now)
    const batas_pembayaran = new Date(Date.now() + (24 * 60 * 60 * 1000));

    // Create ticket
    const ticket = await Tiket.create({
      id_rute: reservation.id_rute,
      id_user: req.user.id_user,
      nomor_kursi: reservation.nomor_kursi,
      tanggal_pemesanan: new Date(),
      status_tiket: 'pending',
      total_bayar: reservation.Rute.harga,
      batas_pembayaran
    }, { transaction });

    // Generate payment code (fallback for non-Midtrans payments)
    const kode_pembayaran = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create payment record (ready for Midtrans integration)
    const payment = await Pembayaran.create({
      id_tiket: ticket.id_tiket,
      metode: metode_pembayaran,
      status: 'pending',
      kode_pembayaran,
      transaction_id: null,
      payment_token: null,
      snap_redirect_url: null
    }, { transaction });

    // Delete the reservation (convert to ticket)
    await reservation.destroy({ transaction });

    // Commit transaction
    await transaction.commit();

    // Get complete ticket data for response
    const completeTicket = await Tiket.findByPk(ticket.id_tiket, {
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

    console.log('Ticket created from reservation successfully');

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat. Lanjutkan ke pembayaran.',
      data: {
        ticket: completeTicket,
        payment: {
          kode_pembayaran,
          metode: metode_pembayaran,
          batas_pembayaran,
          total_bayar: ticket.total_bayar,
          status: 'pending'
        },
        next_steps: {
          create_payment_token: `/api/pembayaran/create`,
          check_status: `/api/pembayaran/status/${ticket.id_tiket}`,
          cancel_payment: `/api/pembayaran/cancel/${ticket.id_tiket}`
        }
      }
    });

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

// Enhanced booking summary with payment information
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

// Complete booking with payment (legacy method for backward compatibility)
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

    // Check if route exists
    const rute = await Rute.findByPk(id_rute, {
      include: [{
        model: Bus,
        attributes: ['nama_bus', 'total_kursi']
      }]
    });

    if (!rute) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }

    // Check seat availability
    const existingBookings = await Promise.all([
      // Check existing tickets
      Tiket.findOne({
        where: {
          id_rute,
          nomor_kursi: seatNumber,
          status_tiket: {
            [Op.in]: ['pending', 'confirmed', 'completed']
          }
        },
        transaction
      }),
      // Check active reservations
      ReservasiSementara.findOne({
        where: {
          id_rute,
          nomor_kursi: seatNumber,
          waktu_expired: {
            [Op.gt]: new Date()
          },
          id_user: {
            [Op.ne]: req.user.id_user // Exclude current user's reservations
          }
        },
        transaction
      })
    ]);

    const [existingTicket, existingReservation] = existingBookings;

    if (existingTicket || existingReservation) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Kursi sudah dipesan atau direservasi'
      });
    }

    // Set payment deadline (24 hours from now)
    const batas_pembayaran = new Date(Date.now() + (24 * 60 * 60 * 1000));

    // Create ticket
    const ticket = await Tiket.create({
      id_rute,
      id_user: req.user.id_user,
      nomor_kursi: seatNumber,
      tanggal_pemesanan: new Date(),
      status_tiket: 'pending',
      total_bayar: rute.harga,
      batas_pembayaran
    }, { transaction });

    // Generate payment code
    const kode_pembayaran = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create payment record
    const payment = await Pembayaran.create({
      id_tiket: ticket.id_tiket,
      metode: metode_pembayaran,
      status: 'pending',
      kode_pembayaran
    }, { transaction });

    // Clear any existing reservations by this user for this seat
    await ReservasiSementara.destroy({
      where: {
        id_user: req.user.id_user,
        id_rute,
        nomor_kursi: seatNumber
      },
      transaction
    });

    await transaction.commit();

    // Get complete ticket data for response
    const completeTicket = await Tiket.findByPk(ticket.id_tiket, {
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

    console.log('Direct ticket created successfully');

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat. Lanjutkan ke pembayaran.',
      data: {
        ticket: completeTicket,
        payment: {
          kode_pembayaran,
          metode: metode_pembayaran,
          batas_pembayaran,
          total_bayar: ticket.total_bayar
        },
        next_steps: {
          create_payment_token: `/api/pembayaran/create`,
          check_status: `/api/pembayaran/status/${ticket.id_tiket}`
        }
      }
    });

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

// Get grouped tickets by ID (NEW FUNCTION)
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