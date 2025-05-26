const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { sequelize } = require('./config/db');
const models = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const ruteRoutes = require('./routes/rute');
const adminRoutes = require('./routes/admin');
const tiketRoutes = require('./routes/tiket');
const reservasiRoutes = require('./routes/reservasi');
const { startCleanupJob, stopCleanupJob } = require('./utils/cleanupJob'); 

// Load env vars
dotenv.config();

// Inisialisasi app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rute', ruteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tiket', tiketRoutes); 
app.use('/api/reservasi', reservasiRoutes);

// Definisikan rute dasar
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Ticketing Bus berjalan dengan baik',
    environment: process.env.NODE_ENV,
    jwtConfigured: !!process.env.JWT_SECRET
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Jalankan server
const server = app.listen(PORT, async () => {
  console.log(`Server berjalan di port ${PORT}`);
  
  try {
    // Sinkronisasi model dengan database
    await sequelize.sync({ alter: true });
    console.log('Sinkronisasi database berhasil');
  } catch (error) {
    console.error('Sinkronisasi database gagal:', error);
  }
});

const startServer = () => {
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start the reservation cleanup job
    startCleanupJob();
  });
};

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopCleanupJob();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopCleanupJob();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});