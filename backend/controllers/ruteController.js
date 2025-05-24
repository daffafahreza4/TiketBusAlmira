const { Rute, Bus } = require('../models');
const { Op } = require('sequelize');

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Rute.findAll({
      attributes: [
        'id_rute', 'id_bus', 'asal', 'tujuan', 
        'waktu_berangkat', 'harga', 'status', 'created_at'
      ],
      include: [{
        model: Bus,
        attributes: ['id_bus', 'nama_bus', 'total_kursi']
      }],
      where: {
        status: 'aktif'
      },
      order: [['waktu_berangkat', 'ASC']]
    });

    // Add estimated arrival time (8 hours after departure as example)
    const routesWithArrival = routes.map(route => {
      const departure = new Date(route.waktu_berangkat);
      const arrival = new Date(departure.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours
      
      return {
        ...route.toJSON(),
        perkiraan_tiba: arrival,
        nama_bus: route.Bus ? route.Bus.nama_bus : 'Bus Tidak Diketahui',
        total_kursi: route.Bus ? route.Bus.total_kursi : 0,
        kursi_tersedia: route.Bus ? route.Bus.total_kursi : 0 // For now, assume all seats available
      };
    });

    res.status(200).json({
      success: true,
      data: routesWithArrival
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const route = await Rute.findByPk(req.params.id, {
      attributes: [
        'id_rute', 'id_bus', 'asal', 'tujuan', 
        'waktu_berangkat', 'harga', 'status', 'created_at'
      ],
      include: [{
        model: Bus,
        attributes: ['id_bus', 'nama_bus', 'total_kursi']
      }]
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Rute tidak ditemukan'
      });
    }

    // Add estimated arrival time
    const departure = new Date(route.waktu_berangkat);
    const arrival = new Date(departure.getTime() + (8 * 60 * 60 * 1000));

    const routeWithDetails = {
      ...route.toJSON(),
      perkiraan_tiba: arrival,
      nama_bus: route.Bus ? route.Bus.nama_bus : 'Bus Tidak Diketahui',
      total_kursi: route.Bus ? route.Bus.total_kursi : 0,
      kursi_tersedia: route.Bus ? route.Bus.total_kursi : 0
    };

    res.status(200).json({
      success: true,
      data: routeWithDetails
    });
  } catch (error) {
    console.error('Get route by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};