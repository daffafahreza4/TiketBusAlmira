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
  }
}, {
  tableName: 'pembayaran',
  timestamps: false
});

module.exports = Pembayaran;