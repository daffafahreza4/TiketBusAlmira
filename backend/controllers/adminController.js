const { User, Bus, Rute, Tiket, Pembayaran } = require('../models');
const { Op, sequelize } = require('sequelize');

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

exports.updateUser = async (req, res) => {
  try {
    const { username, email, no_telepon, role } = req.body;
    const currentUserRole = req.user.role; // Dari middleware auth

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // TAMBAH: Hierarchical protection untuk edit
    if (user.role === 'admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya super admin yang dapat mengedit admin'
      });
    }

    // Prevent editing super_admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin tidak dapat diedit'
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (no_telepon) user.no_telepon = no_telepon;
    if (role && currentUserRole === 'super_admin') {
      // TAMBAH: Hanya super_admin yang bisa ubah role
      user.role = role;
    }

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
    const currentUserRole = req.user.role; // Dari middleware auth
    const targetUser = await User.findByPk(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // TAMBAH: Hierarchical admin protection
    if (targetUser.role === 'admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya super admin yang dapat menghapus admin'
      });
    }

    // Prevent deleting super_admin
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin tidak dapat dihapus'
      });
    }

    await targetUser.destroy();

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

    // UBAH: Validasi nama bus 3-20 karakter
    if (!nama_bus || nama_bus.length < 3 || nama_bus.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Nama bus harus antara 3-20 karakter'
      });
    }

    // TAMBAH: Validasi nama bus unik (case-sensitive)
    const existingBus = await Bus.findOne({
      where: {
        nama_bus: nama_bus // Case-sensitive exact match
      }
    });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Nama bus sudah digunakan'
      });
    }

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

    // UBAH: Validasi nama bus jika diubah (3-20 karakter)
    if (nama_bus) {
      // Validasi 3-20 karakter
      if (nama_bus.length < 3 || nama_bus.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Nama bus harus antara 3-20 karakter'
        });
      }

      // Validasi unik (exclude bus yang sedang diedit)
      const existingBus = await Bus.findOne({
        where: {
          nama_bus: nama_bus,
          id_bus: {
            [Op.ne]: req.params.id
          }
        }
      });

      if (existingBus) {
        return res.status(400).json({
          success: false,
          message: 'Nama bus sudah digunakan'
        });
      }

      bus.nama_bus = nama_bus;
    }

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

// Create a new route - FIXED: Add bus uniqueness validation
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

    // TAMBAH: Validasi bus tidak sedang digunakan di rute aktif lain
    const existingActiveRoute = await Rute.findOne({
      where: {
        id_bus: id_bus,
        status: 'aktif'
      },
      include: [
        {
          model: Bus,
          attributes: ['nama_bus']
        }
      ]
    });

    if (existingActiveRoute) {
      return res.status(400).json({
        success: false,
        message: `Bus "${bus.nama_bus}" sudah digunakan pada rute aktif: ${existingActiveRoute.asal} → ${existingActiveRoute.tujuan}`,
        conflictRoute: {
          id_rute: existingActiveRoute.id_rute,
          asal: existingActiveRoute.asal,
          tujuan: existingActiveRoute.tujuan,
          waktu_berangkat: existingActiveRoute.waktu_berangkat
        }
      });
    }

    // Create route jika validasi passed
    const rute = await Rute.create({
      id_bus,
      asal,
      tujuan,
      waktu_berangkat,
      harga,
      status: status || 'aktif'
    });

    // Return with bus data
    const createdRoute = await Rute.findByPk(rute.id_rute, {
      include: [
        {
          model: Bus,
          attributes: ['nama_bus', 'total_kursi']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Rute berhasil dibuat',
      data: createdRoute
    });
  } catch (error) {
    console.error('❌ Error creating route:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update route (admin only) - FIXED: Add bus uniqueness validation
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

      // TAMBAH: Validasi bus tidak sedang digunakan di rute aktif lain
      // Hanya cek jika bus berubah dari yang sekarang
      if (id_bus !== rute.id_bus) {
        const existingActiveRoute = await Rute.findOne({
          where: {
            id_bus: id_bus,
            status: 'aktif',
            id_rute: {
              [Op.ne]: req.params.id // Exclude rute yang sedang diedit
            }
          },
          include: [
            {
              model: Bus,
              attributes: ['nama_bus']
            }
          ]
        });

        if (existingActiveRoute) {
          return res.status(400).json({
            success: false,
            message: `Bus "${bus.nama_bus}" sudah digunakan pada rute aktif lain: ${existingActiveRoute.asal} → ${existingActiveRoute.tujuan}`,
            conflictRoute: {
              id_rute: existingActiveRoute.id_rute,
              asal: existingActiveRoute.asal,
              tujuan: existingActiveRoute.tujuan,
              waktu_berangkat: existingActiveRoute.waktu_berangkat
            }
          });
        }
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

    // Return updated route with bus data
    const updatedRute = await Rute.findByPk(rute.id_rute, {
      include: [
        {
          model: Bus,
          attributes: ['nama_bus', 'total_kursi']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Rute berhasil diperbarui',
      data: updatedRute
    });
  } catch (error) {
    console.error('❌ Error updating route:', error);
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

// Get available buses - IMPROVED LOGIC FOR 1 BUS = 1 ACTIVE ROUTE
exports.getAvailableBuses = async (req, res) => {
  try {
    console.log('🔍 getAvailableBuses endpoint called!');
    console.log('📝 Query params:', req.query);
    
    const { excludeRouteId } = req.query;

    // Get all buses
    const allBuses = await Bus.findAll({
      attributes: ['id_bus', 'nama_bus', 'total_kursi'],
      order: [['nama_bus', 'ASC']]
    });

    console.log('📋 All buses found:', allBuses.length);

    // Get bus IDs yang sedang digunakan di rute AKTIF
    let whereClause = { status: 'aktif' };
    
    // Jika excludeRouteId ada, exclude dari pengecekan (untuk edit)
    if (excludeRouteId) {
      whereClause.id_rute = { [Op.ne]: excludeRouteId };
    }

    const usedRoutes = await Rute.findAll({
      where: whereClause,
      attributes: ['id_bus', 'asal', 'tujuan'],
      raw: true
    });

    const usedBusIds = usedRoutes.map(route => route.id_bus);
    
    console.log('🚫 Used bus IDs in active routes:', usedBusIds);

    // UNTUK EDIT MODE: Tambahkan bus yang sedang digunakan rute ini sendiri
    let availableBuses = [];
    
    if (excludeRouteId) {
      // Edit mode: tampilkan available buses + current bus
      const currentRoute = await Rute.findByPk(excludeRouteId, {
        attributes: ['id_bus']
      });
      
      availableBuses = allBuses.map(bus => {
        const isCurrentBus = currentRoute && bus.id_bus === currentRoute.id_bus;
        const isAvailable = !usedBusIds.includes(bus.id_bus) || isCurrentBus;
        
        return {
          ...bus.toJSON(),
          isCurrentBus,
          isAvailable
        };
      }).filter(bus => bus.isAvailable);
      
    } else {
      // Create mode: hanya available buses
      availableBuses = allBuses.filter(bus => !usedBusIds.includes(bus.id_bus));
    }
    
    console.log('✅ Available buses:', availableBuses.length);

    res.status(200).json({
      success: true,
      data: availableBuses,
      debug: {
        mode: excludeRouteId ? 'edit' : 'create',
        total: allBuses.length,
        used: usedBusIds.length,
        available: availableBuses.length,
        usedBusIds: usedBusIds,
        excludeRouteId: excludeRouteId
      }
    });

  } catch (error) {
    console.error('❌ Error in getAvailableBuses:', error);
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

// NEW FEATURE: Create verified user/admin (super admin only) - BYPASS OTP
exports.createVerifiedUser = async (req, res) => {
  try {
    const { username, email, password, no_telepon, role = 'user' } = req.body;
    const currentUserRole = req.user.role; // Dari middleware auth

    // SECURITY: Hanya super_admin yang bisa bypass OTP
    if (currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya super admin yang dapat membuat user terverifikasi'
      });
    }

    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, dan password harus diisi'
      });
    }

    // Validasi role
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus user atau admin'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email ?
          'Email sudah terdaftar' : 'Username sudah digunakan'
      });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    // Create user LANGSUNG VERIFIED (bypass OTP)
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by model hook
      no_telepon: no_telepon ? no_telepon.trim() : null,
      role,
      is_verified: true, // BYPASS OTP - LANGSUNG VERIFIED
      verification_token: null,
      verification_token_expire: null
    });

    // Log audit trail
    console.log(`✅ SUPER ADMIN BYPASS OTP: ${req.user.email} created ${role} user: ${email}`);

    res.status(201).json({
      success: true,
      message: `${role === 'admin' ? 'Admin' : 'User'} berhasil dibuat dan langsung aktif`,
      data: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        no_telepon: user.no_telepon,
        is_verified: user.is_verified,
        created_by: req.user.email,
        bypass_otp: true
      }
    });

  } catch (error) {
    console.error('❌ Error creating verified user:', error);
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

// ================================
// 🚀 NEW SUPER ADMIN FEATURES
// ================================

// Get enhanced dashboard stats for super admin
exports.getSuperAdminDashboardStats = async (req, res) => {
  try {
    console.log('🔍 Getting super admin dashboard stats...');
    
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya super admin yang dapat mengakses data ini.'
      });
    }

    // Get all basic stats
    const [
      totalUsers,
      totalBuses,
      totalActiveRoutes,
      totalTickets,
      recentTickets,
      usersByRole,
      adminList
    ] = await Promise.all([
      User.count(),
      Bus.count(),
      Rute.count({ where: { status: 'aktif' } }),
      Tiket.count(),
      
      // Recent tickets with enhanced includes
      Tiket.findAll({
        limit: 10,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id_user', 'username', 'email', 'role']
          },
          {
            model: Rute,
            attributes: ['id_rute', 'asal', 'tujuan', 'waktu_berangkat', 'harga'],
            include: [
              {
                model: Bus,
                attributes: ['id_bus', 'nama_bus', 'total_kursi']
              }
            ]
          }
        ]
      }),
      
      // Enhanced user stats by role
      User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id_user')), 'count']
        ],
        group: ['role'],
        raw: true
      }),
      
      // List of all administrators
      User.findAll({
        where: {
          role: {
            [Op.in]: ['admin', 'super_admin']
          }
        },
        attributes: ['id_user', 'username', 'email', 'role', 'created_at', 'is_verified'],
        order: [
          [sequelize.literal("CASE WHEN role = 'super_admin' THEN 1 ELSE 2 END"), 'ASC'],
          ['created_at', 'ASC']
        ]
      })
    ]);

    // Get ticket stats by status
    const ticketStatsByStatus = await Tiket.findAll({
      attributes: [
        'status_tiket',
        [sequelize.fn('COUNT', sequelize.col('id_tiket')), 'count']
      ],
      group: ['status_tiket'],
      raw: true
    });

    // Calculate revenue (only from confirmed/completed tickets)
    const revenueResult = await Tiket.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_bayar')), 'total_revenue']
      ],
      where: {
        status_tiket: {
          [Op.in]: ['confirmed', 'completed']
        }
      },
      raw: true
    });

    // Format user stats by role
    const roleStats = {
      user: 0,
      admin: 0,
      super_admin: 0,
      total: totalUsers
    };

    usersByRole.forEach(stat => {
      roleStats[stat.role] = parseInt(stat.count);
    });

    // Format ticket stats
    const ticketStats = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      expired: 0,
      total: totalTickets
    };

    ticketStatsByStatus.forEach(stat => {
      ticketStats[stat.status_tiket] = parseInt(stat.count);
    });

    // Enhanced response for super admin
    const enhancedStats = {
      // Basic counts
      totalUsers,
      totalBuses,
      totalActiveRoutes,
      totalTickets,
      totalRevenue: parseFloat(revenueResult?.total_revenue || 0),
      
      // Enhanced role breakdown
      usersByRole: roleStats,
      
      // Administrator details
      administrators: {
        total: adminList.length,
        super_admins: adminList.filter(admin => admin.role === 'super_admin').length,
        regular_admins: adminList.filter(admin => admin.role === 'admin').length,
        list: adminList.map(admin => ({
          id: admin.id_user,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          created_at: admin.created_at,
          is_verified: admin.is_verified,
          display_role: admin.role === 'super_admin' ? 'Super Administrator' : 'Administrator'
        }))
      },
      
      // Ticket analytics
      tickets: ticketStats,
      
      // Recent activities
      recentTickets: recentTickets.map(ticket => ({
        id_tiket: ticket.id_tiket,
        status_tiket: ticket.status_tiket,
        total_bayar: ticket.total_bayar,
        nomor_kursi: ticket.nomor_kursi,
        created_at: ticket.created_at,
        User: ticket.User ? {
          id_user: ticket.User.id_user,
          username: ticket.User.username,
          email: ticket.User.email,
          role: ticket.User.role
        } : null,
        Rute: ticket.Rute ? {
          id_rute: ticket.Rute.id_rute,
          asal: ticket.Rute.asal,
          tujuan: ticket.Rute.tujuan,
          waktu_berangkat: ticket.Rute.waktu_berangkat,
          harga: ticket.Rute.harga,
          Bus: ticket.Rute.Bus ? {
            nama_bus: ticket.Rute.Bus.nama_bus,
            total_kursi: ticket.Rute.Bus.total_kursi
          } : null
        } : null
      })),
      
      // System health indicators
      systemHealth: {
        totalTransactions: totalTickets,
        completionRate: totalTickets > 0 ? 
          ((ticketStats.completed + ticketStats.confirmed) / totalTickets * 100).toFixed(1) : 0,
        averageRevenuePerTicket: totalTickets > 0 ? 
          (parseFloat(revenueResult?.total_revenue || 0) / totalTickets).toFixed(0) : 0
      }
    };

    console.log('✅ Super admin dashboard stats retrieved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Data dashboard super admin berhasil diambil',
      data: enhancedStats
    });

  } catch (error) {
    console.error('❌ Error getting super admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all administrators (super admin only)
exports.getAllAdministrators = async (req, res) => {
  try {
    console.log('🔍 Getting all administrators...');
    
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya super admin yang dapat mengakses data ini.'
      });
    }

    const administrators = await User.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'super_admin']
        }
      },
      attributes: { 
        exclude: ['password', 'verification_token', 'resetPasswordToken'] 
      },
      order: [
        [sequelize.literal("CASE WHEN role = 'super_admin' THEN 1 ELSE 2 END"), 'ASC'],
        ['created_at', 'ASC']
      ]
    });

    const formattedAdmins = administrators.map(admin => ({
      ...admin.toJSON(),
      display_role: admin.role === 'super_admin' ? 'Super Administrator' : 'Administrator',
      can_be_modified: admin.role !== 'super_admin' || admin.id_user === req.user.id_user,
      is_current_user: admin.id_user === req.user.id_user
    }));

    console.log(`✅ Found ${administrators.length} administrators`);
    
    res.status(200).json({
      success: true,
      message: 'Data administrator berhasil diambil',
      data: formattedAdmins,
      meta: {
        total: administrators.length,
        super_admins: administrators.filter(a => a.role === 'super_admin').length,
        regular_admins: administrators.filter(a => a.role === 'admin').length
      }
    });

  } catch (error) {
    console.error('❌ Error getting administrators:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data administrator',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enhanced create verified user (super admin only)
exports.createVerifiedUserEnhanced = async (req, res) => {
  try {
    console.log('🆕 Creating verified user (Super Admin Enhanced)...');
    
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya super admin yang dapat membuat user terverifikasi.'
      });
    }

    const { username, email, password, no_telepon, role = 'user' } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, dan password wajib diisi'
      });
    }

    // Validate role
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus "user" atau "admin"'
      });
    }

    // Validate username length
    if (username.trim().length < 3 || username.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Username harus 3-50 karakter'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Validate password length
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Password harus 6-100 karakter'
      });
    }

    // Check for existing username
    const existingUsername = await User.findOne({
      where: { username: username.trim() }
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Check for existing email
    const existingEmail = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Create user with verification bypassed
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password, // Will be hashed by model hook
      no_telepon: no_telepon || null,
      role,
      is_verified: true, // BYPASS OTP - directly verified
      verification_token: null,
      verification_token_expire: null
    });

    // Remove sensitive data from response
    const userData = newUser.toJSON();
    delete userData.password;
    delete userData.verification_token;
    delete userData.resetPasswordToken;

    console.log(`✅ User created successfully: ${userData.email} (${userData.role})`);
    
    res.status(201).json({
      success: true,
      message: `${role === 'admin' ? 'Administrator' : 'User'} berhasil dibuat dan langsung aktif`,
      data: {
        ...userData,
        display_role: role === 'admin' ? 'Administrator' : 'User',
        created_by: 'Super Admin',
        bypass_otp: true
      }
    });

  } catch (error) {
    console.error('❌ Error creating verified user:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get system analytics for super admin
exports.getSystemAnalytics = async (req, res) => {
  try {
    console.log('📊 Getting system analytics...');
    
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya super admin yang dapat mengakses analytics.'
      });
    }

    // Get analytics data
    const [
      userGrowth,
      ticketTrends,
      revenueAnalytics,
      busUtilization,
      routePerformance
    ] = await Promise.all([
      // User growth over last 30 days
      User.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id_user')), 'count'],
          'role'
        ],
        where: {
          created_at: {
            [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 30 DAY)")
          }
        },
        group: [
          sequelize.fn('DATE', sequelize.col('created_at')),
          'role'
        ],
        order: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']
        ],
        raw: true
      }),

      // Ticket trends over last 30 days
      Tiket.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id_tiket')), 'count'],
          'status_tiket'
        ],
        where: {
          created_at: {
            [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 30 DAY)")
          }
        },
        group: [
          sequelize.fn('DATE', sequelize.col('created_at')),
          'status_tiket'
        ],
        order: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']
        ],
        raw: true
      }),

      // Revenue analytics
      Tiket.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('SUM', sequelize.col('total_bayar')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id_tiket')), 'ticket_count']
        ],
        where: {
          status_tiket: {
            [Op.in]: ['confirmed', 'completed']
          },
          created_at: {
            [Op.gte]: sequelize.literal("DATE_SUB(NOW(), INTERVAL 30 DAY)")
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']
        ],
        raw: true
      }),

      // Bus utilization
      Bus.findAll({
        attributes: [
          'id_bus',
          'nama_bus',
          'total_kursi',
          [sequelize.fn('COUNT', sequelize.col('Rutes.id_rute')), 'active_routes']
        ],
        include: [
          {
            model: Rute,
            attributes: [],
            where: { status: 'aktif' },
            required: false
          }
        ],
        group: ['Bus.id_bus'],
        raw: true
      }),

      // Route performance
      Rute.findAll({
        attributes: [
          'id_rute',
          'asal',
          'tujuan',
          'harga',
          [sequelize.fn('COUNT', sequelize.col('Tikets.id_tiket')), 'total_tickets'],
          [sequelize.fn('SUM', sequelize.col('Tikets.total_bayar')), 'total_revenue']
        ],
        include: [
          {
            model: Tiket,
            attributes: [],
            where: {
              status_tiket: {
                [Op.in]: ['confirmed', 'completed']
              }
            },
            required: false
          }
        ],
        where: { status: 'aktif' },
        group: ['Rute.id_rute'],
        order: [
          [sequelize.fn('COUNT', sequelize.col('Tikets.id_tiket')), 'DESC']
        ],
        limit: 10,
        raw: true
      })
    ]);

    const analytics = {
      user_growth: userGrowth,
      ticket_trends: ticketTrends,
      revenue_analytics: revenueAnalytics,
      bus_utilization: busUtilization,
      top_routes: routePerformance,
      generated_at: new Date().toISOString()
    };

    console.log('✅ System analytics retrieved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Analytics data berhasil diambil',
      data: analytics
    });

  } catch (error) {
    console.error('❌ Error getting system analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};