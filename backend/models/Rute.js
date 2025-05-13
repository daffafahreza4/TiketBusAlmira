const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Rute = sequelize.define('Rute', {
  id_rute: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_bus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bus',
      key: 'id_bus'
    }
  },
  asal: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tujuan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  waktu_berangkat: {
    type: DataTypes.DATE,
    allowNull: false
  },
  harga: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'aktif'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'rute',
  timestamps: false
});

module.exports = Rute;