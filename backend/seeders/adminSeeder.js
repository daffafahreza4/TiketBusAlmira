const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Import models
const { User } = require('../models');

/**
 * Admin Account Seeder for Production Deployment
 * 
 * Membuat akun admin default yang dapat digunakan untuk deployment production
 * 
 * Kredensial Default:
 * - Username: admin
 * - Email: admin@tiketbusalmira.com  
 * - Password: AdminAlmira2024!
 * - Role: admin
 * - Status: Verified
 * 
 * PENTING: Ganti password setelah login pertama kali!
 */

const createAdminAccount = async () => {
  try {
    console.log('🚀 Starting Admin Account Seeder...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync models (create tables if not exist)
    await sequelize.sync();
    console.log('✅ Database models synchronized.');

    // Default admin credentials
    const adminData = {
      username: 'admin',
      email: 'admin@tiketbusalmira.com',
      password: 'AdminAlmira2024!', // Strong default password
      no_telepon: '081234567890',
      role: 'admin',
      is_verified: true, // Auto-verified untuk admin
      verification_token: null,
      verification_token_expire: null
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        [Op.or]: [
          { username: adminData.username },
          { email: adminData.email },
          { role: 'admin' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('   Use existing credentials or delete the account first.');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin account
    const adminUser = await User.create({
      ...adminData,
      password: hashedPassword
    });

    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('📋 ADMIN CREDENTIALS:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│                                         │');
    console.log(`│  Username: ${adminData.username.padEnd(27)} │`);
    console.log(`│  Email:    ${adminData.email.padEnd(27)} │`);
    console.log(`│  Password: ${adminData.password.padEnd(27)} │`);
    console.log(`│  Role:     ${adminData.role.padEnd(27)} │`);
    console.log('│                                         │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');
    console.log('🔐 SECURITY REMINDERS:');
    console.log('   1. Change the password after first login');
    console.log('   2. Update email to your actual admin email');
    console.log('   3. Add phone number for 2FA if needed');
    console.log('   4. Keep these credentials secure');
    console.log('');
    console.log('🌐 LOGIN URL: /admin/login');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating admin account:', error.name || 'Unknown error');
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('');
      console.error('🔌 Database Connection Failed!');
      console.error('┌─────────────────────────────────────────┐');
      console.error('│  Possible solutions:                   │');
      console.error('│  1. Check database is running          │');
      console.error('│  2. Verify .env database credentials   │');
      console.error('│  3. Ensure database exists             │');
      console.error('│  4. Check network connectivity         │');
      console.error('└─────────────────────────────────────────┘');
      console.error('');
      console.error('💡 For development, make sure PostgreSQL is running and .env is configured');
      console.error('💡 For production, verify production database credentials');
      
    } else if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:');
      error.errors.forEach(err => {
        console.error(`   - ${err.path}: ${err.message}`);
      });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Username or email already exists.');
    } else {
      console.error('Detailed error:', error.message);
    }
  } finally {
    // Close database connection safely
    try {
      await sequelize.close();
      console.log('🔌 Database connection closed.');
    } catch (closeError) {
      console.log('ℹ️  Database connection already closed.');
    }
  }
};

// Create additional admin accounts with custom credentials
const createCustomAdmin = async (username, email, password, phone = null) => {
  try {
    console.log(`🚀 Creating custom admin account: ${username}`);
    
    await sequelize.authenticate();
    await sequelize.sync();

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      console.log(`⚠️  User with username "${username}" or email "${email}" already exists.`);
      return false;
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters long.');
      return false;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin account
    const adminUser = await User.create({
      username,
      email,
      password: hashedPassword,
      no_telepon: phone,
      role: 'admin',
      is_verified: true,
      verification_token: null,
      verification_token_expire: null
    });

    console.log(`✅ Custom admin account "${username}" created successfully!`);
    return true;

  } catch (error) {
    console.error(`❌ Error creating custom admin "${username}":`, error.message);
    return false;
  }
};

// Function to generate secure random password
const generateSecurePassword = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default admin creation
    createAdminAccount();
  } else if (args[0] === 'custom') {
    // Custom admin creation: node adminSeeder.js custom username email password [phone]
    if (args.length < 4) {
      console.log('❌ Usage: node adminSeeder.js custom <username> <email> <password> [phone]');
      process.exit(1);
    }
    
    const [, username, email, password, phone] = args;
    createCustomAdmin(username, email, password, phone).then(() => {
      sequelize.close();
    });
  } else if (args[0] === 'generate-password') {
    // Generate secure password: node adminSeeder.js generate-password [length]
    const length = parseInt(args[1]) || 16;
    const securePassword = generateSecurePassword(length);
    console.log(`🔐 Generated secure password: ${securePassword}`);
  } else if (args[0] === 'test') {
    // Test mode - check functionality without database
    console.log('🧪 Testing seeder functionality...');
    console.log('');
    console.log('✅ Password generation:');
    console.log(`   - 16 chars: ${generateSecurePassword(16)}`);
    console.log(`   - 12 chars: ${generateSecurePassword(12)}`);
    console.log(`   - 20 chars: ${generateSecurePassword(20)}`);
    console.log('');
    console.log('✅ Admin credentials template:');
    console.log('   - Username: admin');
    console.log('   - Email: admin@tiketbusalmira.com');
    console.log('   - Password: AdminAlmira2024!');
    console.log('   - Role: admin');
    console.log('');
    console.log('🔧 To actually create admin account:');
    console.log('   1. Ensure PostgreSQL is running');
    console.log('   2. Configure .env database settings');
    console.log('   3. Run: npm run seed:admin');
  } else {
    console.log('❌ Invalid command. Available commands:');
    console.log('   npm run seed:admin                               - Create default admin');
    console.log('   npm run seed:admin-custom <user> <email> <pass>  - Create custom admin');
    console.log('   npm run generate-password [length]               - Generate secure password');
    console.log('   node seeders/adminSeeder.js test                 - Test functionality');
  }
}

module.exports = {
  createAdminAccount,
  createCustomAdmin,
  generateSecurePassword
};