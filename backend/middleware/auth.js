const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'verification_token', 'resetPasswordToken'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Check if user is verified
      if (!user.is_verified) {
        return res.status(401).json({
          success: false,
          message: 'Akun belum diverifikasi. Silakan verifikasi akun Anda terlebih dahulu.',
          requiresVerification: true,
          email: user.email
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah expired, silakan login ulang'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Tidak ada token, akses ditolak'
    });
  }
};

// Middleware untuk route yang tidak memerlukan verifikasi (untuk endpoint verifikasi OTP)
exports.protectUnverified = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'verification_token', 'resetPasswordToken'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Attach user to request (even if not verified)
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah expired, silakan login ulang'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
  } else {
    // No token required for some verification endpoints
    next();
  }
};

// Additional middleware for role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} tidak diizinkan untuk mengakses rute ini`
      });
    }
    
    next();
  };
};