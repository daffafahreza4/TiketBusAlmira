// File: backend/models/Refund.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Refund = sequelize.define('Refund', {
  id_refund: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_tiket: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tiket',
      key: 'id_tiket'
    }
  },
  jumlah_refund: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  alasan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  tanggal_request: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metode_refund: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'refund',
  timestamps: false
});

module.exports = Refund;