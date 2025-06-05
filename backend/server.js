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
const bookingRoutes = require('./routes/booking');
const pembayaranRoutes = require('./routes/pembayaran');
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
app.use('/api/booking', bookingRoutes);
app.use('/api/pembayaran', pembayaranRoutes);

console.log('Server starting with booking routes...');
console.log('Midtrans Environment:', process.env.MIDTRANS_ENVIRONMENT || 'sandbox');

// Definisikan rute dasar
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Ticketing Bus berjalan dengan baik',
    environment: process.env.NODE_ENV,
    jwtConfigured: !!process.env.JWT_SECRET,
    midtransConfigured: !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY),
    features: {
      auth: true,
      booking: true,
      payment: !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY),
      notifications: !!process.env.EMAIL_USER
    }
  });
});

// Health check endpoint for payment system
app.get('/api/health/payment', (req, res) => {
  const paymentHealth = {
    midtrans: {
      configured: !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY),
      environment: process.env.MIDTRANS_ENVIRONMENT || 'sandbox',
      webhookUrl: process.env.MIDTRANS_WEBHOOK_URL || 'Not configured'
    },
    database: {
      connected: sequelize.authenticate !== undefined
    }
  };

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    paymentSystem: paymentHealth
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
    
    // Start cleanup job
    startCleanupJob();
    console.log('Cleanup job started');

    // Log configured features
    console.log('Available features:');
    console.log('   - Authentication:', !!process.env.JWT_SECRET);
    console.log('   - Payment (Midtrans):', !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY));
    console.log('   - Email notifications:', !!process.env.EMAIL_USER);
    console.log('   - SMS notifications:', !!process.env.TWILIO_ACCOUNT_SID);

  } catch (error) {
    console.error('Sinkronisasi database gagal:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopCleanupJob();
  server.close(() => {
    console.log('Server shut down successfully');
    process.exit(0);
  });
});