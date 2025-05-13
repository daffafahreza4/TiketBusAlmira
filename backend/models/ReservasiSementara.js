const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReservasiSementara = sequelize.define('ReservasiSementara', {
  id_reservasi: {
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
  waktu_reservasi: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  waktu_expired: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'reservasi_sementara',
  timestamps: false
});

module.exports = ReservasiSementara;