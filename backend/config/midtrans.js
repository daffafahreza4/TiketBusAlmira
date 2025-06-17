const midtransClient = require('midtrans-client');
require('dotenv').config();
const isProduction = process.env.MIDTRANS_ENVIRONMENT === 'production';

// Core API configuration (for server-side operations)
const core = new midtransClient.CoreApi({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Snap API configuration (for payment page)
const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Iris API configuration (for disbursement - optional)
const iris = new midtransClient.Iris({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Midtrans configuration object
const midtransConfig = {
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
  merchantId: process.env.MIDTRANS_MERCHANT_ID,
  environment: process.env.MIDTRANS_ENVIRONMENT || 'sandbox',
  webhookUrl: process.env.MIDTRANS_WEBHOOK_URL,
  
  // API URLs
  baseUrl: isProduction 
    ? 'https://api.midtrans.com' 
    : 'https://api.sandbox.midtrans.com',
  
  snapUrl: isProduction 
    ? 'https://app.midtrans.com/snap/snap.js' 
    : 'https://app.sandbox.midtrans.com/snap/snap.js',
  
  // Payment settings
  paymentSettings: {
    creditCard: {
      secure: true,
      channel: 'migs',
      bank: 'bni',
      installment: {
        required: false,
        terms: {
          bni: [3, 6, 12],
          mandiri: [3, 6, 12],
          cimb: [3],
          bca: [3, 6, 12],
          offline: [6, 12]
        }
      }
    },
    bankTransfer: {
      bank: ['permata', 'bca', 'bni', 'bri', 'other']
    },
    echannel: {
      billInfo1: 'Payment for Bus Ticket',
      billInfo2: 'Tiket Bus Almira'
    }
  }
};

// Validation function
const validateConfig = () => {
  const requiredEnvVars = [
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Midtrans environment variables: ${missing.join(', ')}`);
  }

  console.log('Midtrans configuration validated successfully');
  console.log(`Environment: ${midtransConfig.environment}`);
};

module.exports = {
  core,
  snap,
  iris,
  config: midtransConfig,
  validateConfig
};