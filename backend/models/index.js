const User = require('./User');
const Bus = require('./Bus');
const Rute = require('./Rute');
const Tiket = require('./Tiket');
const Pembayaran = require('./Pembayaran');
const ReservasiSementara = require('./ReservasiSementara');

// Relasi Bus dan Rute
Bus.hasMany(Rute, { foreignKey: 'id_bus' });
Rute.belongsTo(Bus, { foreignKey: 'id_bus' });

// Relasi User dan Tiket
User.hasMany(Tiket, { foreignKey: 'id_user' });
Tiket.belongsTo(User, { foreignKey: 'id_user' });

// Relasi Rute dan Tiket
Rute.hasMany(Tiket, { foreignKey: 'id_rute' });
Tiket.belongsTo(Rute, { foreignKey: 'id_rute' });

// Relasi Tiket dan Pembayaran
Tiket.hasOne(Pembayaran, { foreignKey: 'id_tiket' });
Pembayaran.belongsTo(Tiket, { foreignKey: 'id_tiket' });

// Relasi User dan ReservasiSementara
User.hasMany(ReservasiSementara, { foreignKey: 'id_user' });
ReservasiSementara.belongsTo(User, { foreignKey: 'id_user' });

// Relasi Rute dan ReservasiSementara
Rute.hasMany(ReservasiSementara, { foreignKey: 'id_rute' });
ReservasiSementara.belongsTo(Rute, { foreignKey: 'id_rute' });

module.exports = {
  User,
  Bus,
  Rute,
  Tiket,
  Pembayaran,
  ReservasiSementara
};