const { User, Bus, Rute, Tiket, Pembayaran, Refund } = require('../models');
const { Op } = require('sequelize');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, no_telepon, role } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (no_telepon) user.no_telepon = no_telepon;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        no_telepon: user.no_telepon
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create a new bus (admin only)
exports.createBus = async (req, res) => {
  try {
    const { nama_bus, total_kursi } = req.body;

    const bus = await Bus.create({
      nama_bus,
      total_kursi
    });

    res.status(201).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get all buses (admin only)
exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.findAll();

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update bus (admin only)
exports.updateBus = async (req, res) => {
  try {
    const { nama_bus, total_kursi } = req.body;

    const bus = await Bus.findByPk(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus tidak ditemukan'
      });
    }

    // Update fields
    if (nama_bus) bus.nama_bus = nama_bus;
    if (total_kursi) bus.total_kursi = total_kursi;

    await bus.save();

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete bus (admin only)
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus tidak ditemukan'
      });
    }

    await bus.destroy();

    res.status(200).json({
      success: true,
      message: 'Bus berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Create a new route (admin only)
exports.createRoute = async (req, res) => {
  try {
    const { id_bus, asal, tujuan, waktu_berangkat, harga, status } = req.body;

    // Check if bus exists
    const bus = await Bus.findByPk(id_bus);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus tidak ditemukan'
      });
    }

    const rute = await Rute.create({
      id_bus,
      asal,
      tujuan,
      waktu_berangkat,
      harga,
      status: status || 'aktif'
    });

    res.status(201).json({
      success: true,
      data: rute
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update route (admin only)
exports.updateRoute = async (req, res) => {
  try {
    const { id_bus, asal, tujuan, waktu_berangkat, harga, status } = req.body;

    const rute = await Rute.findByPk(req.params.id);

    if (!rute) {
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }

    // Check if bus exists if id_bus is provided
    if (id_bus) {
      const bus = await Bus.findByPk(id_bus);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus tidak ditemukan'
        });
      }
      rute.id_bus = id_bus;
    }

    // Update fields
    if (asal) rute.asal = asal;
    if (tujuan) rute.tujuan = tujuan;
    if (waktu_berangkat) rute.waktu_berangkat = waktu_berangkat;
    if (harga) rute.harga = harga;
    if (status) rute.status = status;

    await rute.save();

    res.status(200).json({
      success: true,
      data: rute
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete route (admin only)
exports.deleteRoute = async (req, res) => {
  try {
    const rute = await Rute.findByPk(req.params.id);

    if (!rute) {
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }

    await rute.destroy();

    res.status(200).json({
      success: true,
      message: 'Rute berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get all tickets (admin only)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Tiket.findAll({
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

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update ticket status (admin only)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status_tiket } = req.body;

    const ticket = await Tiket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    // Update status
    ticket.status_tiket = status_tiket;
    await ticket.save();

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

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, no_telepon, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      no_telepon,
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      data: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        no_telepon: user.no_telepon
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get all routes (admin only)
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Rute.findAll({
      include: [{
        model: Bus,
        attributes: ['nama_bus', 'total_kursi']
      }],
      order: [['waktu_berangkat', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Delete ticket (admin only)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Tiket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        },
        {
          model: Rute,
          attributes: ['asal', 'tujuan']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    // Check if ticket can be deleted (business logic)
    if (ticket.status_tiket === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Tiket yang sudah selesai tidak dapat dihapus'
      });
    }

    await ticket.destroy();

    res.status(200).json({
      success: true,
      message: 'Tiket berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get dashboard stats (admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.count();

    // Count total buses
    const totalBuses = await Bus.count();

    // Count total active routes
    const totalActiveRoutes = await Rute.count({
      where: {
        status: 'aktif'
      }
    });

    // Count tickets by status
    const pendingTickets = await Tiket.count({
      where: {
        status_tiket: 'pending'
      }
    });

    const confirmedTickets = await Tiket.count({
      where: {
        status_tiket: 'confirmed'
      }
    });

    const completedTickets = await Tiket.count({
      where: {
        status_tiket: 'completed'
      }
    });

    const cancelledTickets = await Tiket.count({
      where: {
        status_tiket: 'cancelled'
      }
    });

    // Sum total revenue from completed tickets
    const totalRevenue = await Tiket.sum('total_bayar', {
      where: {
        status_tiket: {
          [Op.in]: ['confirmed', 'completed']
        }
      }
    });

    // Get recent tickets (5 most recent)
    const recentTickets = await Tiket.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        },
        {
          model: Rute,
          attributes: ['asal', 'tujuan', 'waktu_berangkat'],
          include: [
            {
              model: Bus,
              attributes: ['nama_bus']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBuses,
        totalActiveRoutes,
        tickets: {
          pending: pendingTickets,
          confirmed: confirmedTickets,
          completed: completedTickets,
          cancelled: cancelledTickets,
          total: pendingTickets + confirmedTickets + completedTickets + cancelledTickets
        },
        totalRevenue: totalRevenue || 0,
        recentTickets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};