const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Bus = sequelize.define('Bus', {
  id_bus: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_bus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  total_kursi: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bus',
  timestamps: false
});

module.exports = Bus;