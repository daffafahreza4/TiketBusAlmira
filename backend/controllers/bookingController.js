const { Tiket, User, Rute, Bus, ReservasiSementara, Pembayaran } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

// Create ticket from reservation (Complete booking process)
exports.createTicketFromReservation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id_reservasi, metode_pembayaran } = req.body;

    // Validate required fields
    if (!id_reservasi || !metode_pembayaran) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID reservasi dan metode pembayaran harus diisi'
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

    // Generate payment code
    const kode_pembayaran = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create payment record
    const payment = await Pembayaran.create({
      id_tiket: ticket.id_tiket,
      metode: metode_pembayaran,
      status: 'pending',
      kode_pembayaran
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

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        ticket: completeTicket,
        payment: {
          kode_pembayaran,
          metode: metode_pembayaran,
          batas_pembayaran,
          total_bayar: ticket.total_bayar
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create ticket from reservation error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat tiket'
    });
  }
};

// Direct ticket creation (without reservation - for backward compatibility)
exports.createTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id_rute, nomor_kursi, metode_pembayaran } = req.body;

    // Validate required fields
    if (!id_rute || !nomor_kursi || !metode_pembayaran) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID rute, nomor kursi, dan metode pembayaran harus diisi'
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
          nomor_kursi,
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
          nomor_kursi,
          waktu_expired: {
            [Op.gt]: new Date()
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
      nomor_kursi,
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

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        ticket: completeTicket,
        payment: {
          kode_pembayaran,
          metode: metode_pembayaran,
          batas_pembayaran,
          total_bayar: ticket.total_bayar
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create direct ticket error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat tiket'
    });
  }
};

// Get booking summary for checkout
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
      total_bayar: reservation.Rute.harga
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get booking summary error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil ringkasan booking'
    });
  }
};