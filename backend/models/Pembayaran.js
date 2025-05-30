const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Pembayaran = sequelize.define('Pembayaran', {
  id_pembayaran: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_tiket: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'tiket',
      key: 'id_tiket'
    }
  },
  metode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  waktu_pembayaran: {
    type: DataTypes.DATE,
    allowNull: true
  },
  kode_pembayaran: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Midtrans specific fields
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Midtrans order_id'
  },
  payment_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Midtrans Snap token'
  },
  snap_redirect_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Midtrans Snap redirect URL'
  },
  response_midtrans: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full response from Midtrans webhook (JSON)'
  },
  payment_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment type from Midtrans (credit_card, bank_transfer, etc.)'
  },
  va_number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Virtual Account number for bank transfer'
  },
  bank: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Bank name for bank transfer'
  },
  // Audit fields
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pembayaran',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeUpdate: (instance) => {
      instance.updated_at = new Date();
    }
  }
});

module.exports = Pembayaran;