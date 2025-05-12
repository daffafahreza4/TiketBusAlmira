// File: backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  let token;

  // Cek header untuk token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Pastikan token ada
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Tidak diizinkan untuk mengakses rute ini'
    });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil data user dari id dalam payload token
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Set user ke req.user
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Tidak diizinkan untuk mengakses rute ini'
    });
  }
};

// Middleware untuk roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} tidak diizinkan untuk mengakses rute ini`
      });
    }
    next();
  };
};