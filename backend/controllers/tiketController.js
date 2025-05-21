const { Tiket, User, Rute, Pembayaran, Bus } = require('../models');

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
              attributes: ['nama_bus', 'total_kursi', 'fasilitas']
            }
          ]
        },
        {
          model: Pembayaran
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
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
              attributes: ['nama_bus', 'total_kursi', 'fasilitas']
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

// Get available seats for a route
exports.getAvailableSeats = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Logika untuk mendapatkan kursi yang tersedia
    // Ini contoh sederhana, sesuaikan dengan model dan logika bisnis Anda
    const bookedSeats = await Tiket.findAll({
      where: {
        id_rute: routeId,
        status_tiket: ['pending', 'confirmed', 'completed']
      },
      attributes: ['nomor_kursi']
    });
    
    const route = await Rute.findByPk(routeId, {
      include: [{ model: Bus }]
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }
    
    const totalSeats = route.Bus.total_kursi;
    const allPossibleSeats = [];
    
    // Generate all possible seats (example: 10 rows with 4 seats each - 1A,1B,1C,1D, etc.)
    for (let i = 1; i <= Math.ceil(totalSeats / 4); i++) {
      allPossibleSeats.push(`${i}A`, `${i}B`, `${i}C`, `${i}D`);
    }
    
    // Filter out booked seats
    const bookedSeatNumbers = bookedSeats.map(seat => seat.nomor_kursi);
    const availableSeats = allPossibleSeats.filter(seat => !bookedSeatNumbers.includes(seat));
    
    res.status(200).json({
      success: true,
      data: availableSeats.slice(0, totalSeats) // Ensure we don't return more seats than the bus has
    });
  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};