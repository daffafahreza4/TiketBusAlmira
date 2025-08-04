const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id_user: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  no_telepon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // PERBAIKAN: Menggunakan STRING dengan validasi instead of ENUM
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: {
        args: [['user', 'admin', 'super_admin']],
        msg: 'Role harus salah satu dari: user, admin, atau super_admin'
      }
    }
  },
  // Email verification fields
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verification_token_expire: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Password reset fields
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Method untuk membandingkan password
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method untuk generate verification token (6 digit OTP)
User.prototype.generateVerificationToken = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.verification_token = otp;
  this.verification_token_expire = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

// Method untuk check if verification token is valid
User.prototype.isVerificationTokenValid = function(token) {
  return this.verification_token === token && 
         this.verification_token_expire && 
         this.verification_token_expire > new Date();
};

// Method untuk clear verification token
User.prototype.clearVerificationToken = function() {
  this.verification_token = null;
  this.verification_token_expire = null;
  this.is_verified = true;
};

// TAMBAH: Method untuk check role hierarchy
User.prototype.canManageUser = function(targetUser) {
  const roleHierarchy = {
    'super_admin': 3,
    'admin': 2,
    'user': 1
  };
  
  const myLevel = roleHierarchy[this.role] || 0;
  const targetLevel = roleHierarchy[targetUser.role] || 0;
  
  return myLevel > targetLevel;
};

// TAMBAH: Method untuk check if user is admin or above
User.prototype.isAdmin = function() {
  return this.role === 'admin' || this.role === 'super_admin';
};

// TAMBAH: Method untuk check if user is super admin
User.prototype.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

// TAMBAH: Method untuk get role display name
User.prototype.getRoleDisplayName = function() {
  const roleNames = {
    'user': 'User',
    'admin': 'Administrator',
    'super_admin': 'Super Administrator'
  };
  
  return roleNames[this.role] || 'Unknown';
};

// TAMBAH: Static method untuk create super admin
User.createSuperAdmin = async function(userData) {
  try {
    const existingSuperAdmin = await User.findOne({
      where: {
        email: userData.email
      }
    });

    if (existingSuperAdmin) {
      throw new Error('Super admin dengan email ini sudah ada');
    }

    const superAdmin = await User.create({
      username: userData.username || 'Super Administrator',
      email: userData.email,
      password: userData.password,
      no_telepon: userData.no_telepon || null,
      role: 'super_admin',
      is_verified: true
    });

    return superAdmin;
  } catch (error) {
    throw error;
  }
};

// TAMBAH: Static method untuk get all admins
User.getAllAdmins = async function() {
  try {
    const admins = await User.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'super_admin']
        }
      },
      attributes: { exclude: ['password', 'verification_token', 'resetPasswordToken'] },
      order: [
        ['role', 'DESC'],
        ['created_at', 'ASC']
      ]
    });

    return admins;
  } catch (error) {
    throw error;
  }
};

// TAMBAH: Static method untuk count users by role
User.countByRole = async function() {
  try {
    const counts = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id_user')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const result = {
      user: 0,
      admin: 0,
      super_admin: 0,
      total: 0
    };

    counts.forEach(item => {
      result[item.role] = parseInt(item.count);
      result.total += parseInt(item.count);
    });

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = User;