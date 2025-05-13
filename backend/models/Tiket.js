const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Tiket = sequelize.define('Tiket', {
  id_tiket: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_rute: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rute',
      key: 'id_rute'
    }
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id_user'
    }
  },
  nomor_kursi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tanggal_pemesanan: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status_tiket: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  total_bayar: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  batas_pembayaran: {
    type: DataTypes.DATE,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tiket',
  timestamps: false
});

module.exports = Tiket;