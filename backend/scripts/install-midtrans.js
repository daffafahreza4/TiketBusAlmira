const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Midtrans Payment Integration Setup...\n');

/**
 * Check if Midtrans is already installed
 */
function checkMidtransInstallation() {
  try {
    require.resolve('midtrans-client');
    console.log('✅ midtrans-client is already installed');
    return true;
  } catch (e) {
    console.log('📦 midtrans-client not found, will install...');
    return false;
  }
}

/**
 * Install Midtrans client
 */
function installMidtransClient() {
  console.log('📦 Installing midtrans-client...');
  try {
    execSync('npm install midtrans-client', { stdio: 'inherit' });
    console.log('✅ midtrans-client installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install midtrans-client:', error.message);
    process.exit(1);
  }
}

/**
 * Create environment file template
 */
function createEnvTemplate() {
  const envPath = path.join(__dirname, '..', '.env.example');
  const envContent = `# File: backend/.env.example

# Database Configuration
DB_NAME=tiket_bus_almira
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Tiket Bus Almira

# SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ================================
# MIDTRANS CONFIGURATION (TASK 2)
# ================================

# Midtrans Environment (sandbox/production)
MIDTRANS_ENVIRONMENT=sandbox

# Midtrans API Keys (Get from https://dashboard.midtrans.com)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_MERCHANT_ID=your-merchant-id

# Midtrans Webhook URL
MIDTRANS_WEBHOOK_URL=https://yourdomain.com/api/pembayaran/notification

# ================================
# MIDTRANS SANDBOX TEST KEYS
# ================================
# For testing, you can use Midtrans sandbox credentials
# Get them from: https://dashboard.sandbox.midtrans.com
# Server Key format: SB-Mid-server-xxxxxxxxxxxxxxxxx
# Client Key format: SB-Mid-client-xxxxxxxxxxxxxxxxx
`;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.example template');
  } else {
    console.log('✅ .env.example already exists');
  }
}

/**
 * Check current .env file
 */
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found');
    console.log('📝 Please copy .env.example to .env and configure your Midtrans keys');
    console.log('💡 Get your keys from: https://dashboard.midtrans.com\n');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredKeys = [
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY',
    'MIDTRANS_ENVIRONMENT'
  ];

  const missingKeys = requiredKeys.filter(key => 
    !envContent.includes(key) || envContent.includes(`${key}=your-`) || envContent.includes(`${key}=`)
  );

  if (missingKeys.length > 0) {
    console.log('⚠️  Missing or incomplete Midtrans configuration in .env:');
    missingKeys.forEach(key => console.log(`   - ${key}`));
    console.log('📝 Please configure these keys in your .env file\n');
    return false;
  }

  console.log('✅ Midtrans environment variables configured');
  return true;
}

/**
 * Test Midtrans configuration
 */
function testMidtransConfig() {
  console.log('🧪 Testing Midtrans configuration...');
  
  try {
    require('dotenv').config();
    const { validateConfig } = require('../config/midtrans');
    validateConfig();
    console.log('✅ Midtrans configuration is valid\n');
    return true;
  } catch (error) {
    console.log('❌ Midtrans configuration error:', error.message);
    console.log('📝 Please check your .env file and Midtrans keys\n');
    return false;
  }
}

/**
 * Create logs directory
 */
function createLogsDirectory() {
  const logsDir = path.join(__dirname, '..', 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Created logs directory');
  } else {
    console.log('✅ Logs directory already exists');
  }
}

/**
 * Display next steps
 */
function displayNextSteps() {
  console.log('\n🎉 Midtrans Payment Integration Setup Complete!\n');
  console.log('📋 Next Steps:');
  console.log('1. 🔐 Configure your .env file with Midtrans keys');
  console.log('2. 🌐 Get your keys from: https://dashboard.midtrans.com');
  console.log('3. 🧪 Test configuration: npm run test-payment');
  console.log('4. 🚀 Start development server: npm run dev');
  console.log('5. 📱 Test payment flow with frontend integration\n');
  
  console.log('🔗 Useful Resources:');
  console.log('- Midtrans Documentation: https://docs.midtrans.com');
  console.log('- Sandbox Dashboard: https://dashboard.sandbox.midtrans.com');
  console.log('- Production Dashboard: https://dashboard.midtrans.com\n');
  
  console.log('💳 Test Credit Cards (Sandbox):');
  console.log('- Success: 4811 1111 1111 1114');
  console.log('- Failure: 4911 1111 1111 1113');
  console.log('- Challenge: 4411 1111 1111 1118\n');
}

/**
 * Main installation function
 */
async function main() {
  try {
    // Step 1: Check and install midtrans-client
    if (!checkMidtransInstallation()) {
      installMidtransClient();
    }

    // Step 2: Create environment template
    createEnvTemplate();

    // Step 3: Check environment configuration
    const envConfigured = checkEnvFile();

    // Step 4: Test configuration (only if env is configured)
    if (envConfigured) {
      testMidtransConfig();
    }

    // Step 5: Create logs directory
    createLogsDirectory();

    // Step 6: Display next steps
    displayNextSteps();

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  checkMidtransInstallation,
  installMidtransClient,
  createEnvTemplate,
  checkEnvFile,
  testMidtransConfig,
  createLogsDirectory
};