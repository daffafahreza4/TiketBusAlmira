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
    unique: true
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
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
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
  timestamps: false, // Karena kita menggunakan created_at manual
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
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set verification token and expiry (10 minutes)
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

module.exports = User;