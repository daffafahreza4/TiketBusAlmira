const crypto = require('crypto');
const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { sendVerificationOTP, sendPasswordResetEmail } = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const { Op } = require('sequelize');

// Register new user with email verification
exports.register = async (req, res) => {
  try {
    const { username, email, password, no_telepon } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      where: { email }
    });

    if (userExists) {
      // If user exists but not verified, allow resending OTP
      if (!userExists.is_verified) {
        const otp = userExists.generateVerificationToken();
        await userExists.save({ validate: false });

        // Send OTP email
        try {
          await sendVerificationOTP(email, username, otp);
          
          return res.status(200).json({
            success: true,
            message: 'Akun sudah terdaftar tetapi belum diverifikasi. Kode OTP baru telah dikirim ke email Anda.',
            requiresVerification: true,
            email: email
          });
        } catch (emailError) {
          console.error('Send OTP error:', emailError);
          return res.status(500).json({
            success: false,
            message: 'Gagal mengirim kode OTP. Silakan coba lagi.'
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar dan terverifikasi'
      });
    }

    // Create new user (not verified yet)
    const user = await User.create({
      username,
      email,
      password,
      no_telepon,
      role: 'user',
      is_verified: false
    });

    // Generate OTP
    const otp = user.generateVerificationToken();
    await user.save({ validate: false });

    // Send OTP email
    try {
      await sendVerificationOTP(email, username, otp);
      
      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil! Kode OTP telah dikirim ke email Anda. Silakan verifikasi akun Anda.',
        requiresVerification: true,
        email: email,
        data: {
          id: user.id_user,
          username: user.username,
          email: user.email,
          is_verified: user.is_verified
        }
      });
    } catch (emailError) {
      console.error('Send OTP error:', emailError);
      // Delete user if email sending fails
      await user.destroy();
      
      return res.status(500).json({
        success: false,
        message: 'Registrasi gagal. Tidak dapat mengirim email verifikasi. Silakan coba lagi.'
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email dan kode OTP harus diisi'
      });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Akun sudah terverifikasi'
      });
    }

    // Check if OTP is valid
    if (!user.isVerificationTokenValid(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Kode OTP tidak valid atau sudah kadaluarsa'
      });
    }

    // Verify user
    user.clearVerificationToken();
    await user.save({ validate: false });

    // Generate token for auto-login
    const token = generateToken(user.id_user);

    res.status(200).json({
      success: true,
      message: 'Verifikasi berhasil! Akun Anda telah diaktifkan.',
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        token
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email harus diisi'
      });
    }

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Akun sudah terverifikasi'
      });
    }

    // Generate new OTP
    const otp = user.generateVerificationToken();
    await user.save({ validate: false });

    // Send OTP email
    try {
      await sendVerificationOTP(email, user.username, otp);
      
      res.status(200).json({
        success: true,
        message: 'Kode OTP baru telah dikirim ke email Anda'
      });
    } catch (emailError) {
      console.error('Resend OTP error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim kode OTP. Silakan coba lagi.'
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// Login user (only verified users can login)
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
        message: 'Email atau password tidak valid'
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Akun belum diverifikasi. Silakan cek email Anda.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password tidak valid'
      });
    }

    // Generate token
    const token = generateToken(user.id_user);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
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
      attributes: { exclude: ['password', 'verification_token', 'resetPasswordToken'] }
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

    // If email is being changed, require verification
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({
        where: { 
          email,
          id_user: { [Op.ne]: user.id_user }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan oleh user lain'
        });
      }

      // Update email and mark as unverified
      user.email = email;
      user.is_verified = false;
      
      // Generate OTP for new email
      const otp = user.generateVerificationToken();
      await user.save({ validate: false });

      // Send OTP to new email
      try {
        await sendVerificationOTP(email, user.username, otp);
        
        return res.status(200).json({
          success: true,
          message: 'Email berhasil diubah. Kode OTP telah dikirim ke email baru Anda untuk verifikasi.',
          requiresVerification: true,
          data: {
            id: user.id_user,
            username: user.username,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified,
            no_telepon: user.no_telepon
          }
        });
      } catch (emailError) {
        console.error('Send OTP error:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim email verifikasi'
        });
      }
    }

    // Update other fields
    if (username) user.username = username;
    if (no_telepon) user.no_telepon = no_telepon;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        no_telepon: user.no_telepon
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

// Forgot password (only for verified users)
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

    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Akun belum diverifikasi. Silakan verifikasi akun terlebih dahulu.',
        requiresVerification: true,
        email: user.email
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

    // PERBAIKAN: URL harus mengarah ke FRONTEND (localhost:3000), bukan backend (localhost:5000)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.username, resetUrl);

      res.status(200).json({
        success: true,
        message: 'Link reset password telah dikirim ke email Anda'
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

    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Akun belum diverifikasi'
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

// Change password (for logged in users)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi'
      });
    }

    const user = await User.findByPk(req.user.id_user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    console.error('Change password error:', error);
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

    if (!user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'User belum terverifikasi'
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
        role: user.role,
        is_verified: user.is_verified
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