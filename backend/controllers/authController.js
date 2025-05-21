const crypto = require('crypto');
const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const { Op } = require('sequelize');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, no_telepon } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      no_telepon,
      role: 'user'
    });

    // Generate token
    const token = generateToken(user.id_user);

    res.status(201).json({
      success: true,
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email atau password'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email atau password'
      });
    }

    // Generate token
    const token = generateToken(user.id_user);

    res.status(200).json({
      success: true,
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi'
      });
    }

    // Get fresh user data from database
    const user = await User.findByPk(req.user.id_user, {
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, no_telepon, password } = req.body;

    const user = await User.findByPk(req.user.id_user);

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
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email tidak terdaftar'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set reset password token and expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token berlaku 10 menit

    await user.save({ validate: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    const message = `Anda menerima email ini karena Anda (atau orang lain) telah meminta reset password. Klik link berikut untuk melanjutkan: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Password',
        message,
        html: `<p>Anda menerima email ini karena Anda (atau orang lain) telah meminta reset password.</p><p>Klik link berikut untuk melanjutkan:</p><p><a href="${resetUrl}">Reset Password</a></p>`
      });

      res.status(200).json({
        success: true,
        message: 'Email terkirim'
      });
    } catch (err) {
      console.error('Send email error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validate: false });

      return res.status(500).json({
        success: false,
        message: 'Email gagal terkirim'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Reset password SMS
exports.resetPasswordSMS = async (req, res) => {
  try {
    const { no_telepon } = req.body;

    const user = await User.findOne({
      where: { no_telepon }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Nomor telepon tidak terdaftar'
      });
    }

    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

    // Set reset password token and expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token berlaku 10 menit

    await user.save({ validate: false });

    const message = `Kode reset password Anda adalah: ${resetToken}. Kode ini berlaku selama 10 menit.`;

    try {
      await sendSMS({
        to: user.no_telepon,
        message
      });

      res.status(200).json({
        success: true,
        message: 'SMS terkirim'
      });
    } catch (err) {
      console.error('Send SMS error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validate: false });

      return res.status(500).json({
        success: false,
        message: 'SMS gagal terkirim'
      });
    }
  } catch (error) {
    console.error('Reset password SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid atau telah expired'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Verify SMS code
exports.verifySMSCode = async (req, res) => {
  try {
    const { code, no_telepon, password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    const user = await User.findOne({
      where: {
        no_telepon,
        resetPasswordToken,
        resetPasswordExpire: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Kode tidak valid atau telah expired'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Verify SMS code error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Make user an admin (only accessible by admin)
exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Change role to admin
    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.username} berhasil dijadikan admin`,
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};