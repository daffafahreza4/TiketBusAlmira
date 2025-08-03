const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Import models
const { User } = require('../models');

/**
 * User Account Seeder for Development/Testing
 * 
 * Membuat akun user dan admin initial untuk development dan testing
 */

const createInitialUsers = async () => {
  try {
    console.log('🚀 Starting User Account Seeder...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync models (create tables if not exist)
    await sequelize.sync();
    console.log('✅ Database models synchronized.');

    // Define users to create
    const usersToCreate = [
      // Regular users
      {
        username: 'user1',
        email: 'user1@gmail.com',
        password: 'user123',
        no_telepon: '081234567801',
        role: 'user',
        is_verified: true
      },
      {
        username: 'user2',
        email: 'user2@gmail.com',
        password: 'user123',
        no_telepon: '081234567802',
        role: 'user',
        is_verified: true
      },
      {
        username: 'user3',
        email: 'user3@gmail.com',
        password: 'user123',
        no_telepon: '081234567803',
        role: 'user',
        is_verified: true
      },
      {
        username: 'user4',
        email: 'user4@gmail.com',
        password: 'user123',
        no_telepon: '081234567804',
        role: 'user',
        is_verified: true
      },
      // Admin users
      {
        username: 'admin1',
        email: 'admin1@gmail.com',
        password: 'admin123',
        no_telepon: '081234567901',
        role: 'admin',
        is_verified: true
      },
      {
        username: 'admin2',
        email: 'admin2@gmail.com',
        password: 'admin123',
        no_telepon: '081234567902',
        role: 'admin',
        is_verified: true
      },
      {
        username: 'admin3',
        email: 'admin3@gmail.com',
        password: 'admin123',
        no_telepon: '081234567903',
        role: 'admin',
        is_verified: true
      },
      {
        username: 'admin4',
        email: 'admin4@gmail.com',
        password: 'admin123',
        no_telepon: '081234567904',
        role: 'admin',
        is_verified: true
      }
    ];

    let createdUsers = 0;
    let skippedUsers = 0;

    console.log('📝 Creating users...');
    console.log('');

    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { username: userData.username },
              { email: userData.email }
            ]
          }
        });

        if (existingUser) {
          console.log(`⚠️  User already exists: ${userData.email}`);
          skippedUsers++;
          continue;
        }

        // Password akan di-hash otomatis oleh hook beforeCreate di model User

        // Create user
        await User.create({
          ...userData,
          verification_token: null,
          verification_token_expire: null
        });

        console.log(`✅ Created ${userData.role}: ${userData.email}`);
        createdUsers++;

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('');
    console.log('📊 SEEDING SUMMARY:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│                                         │');
    console.log(`│  Users created:  ${createdUsers.toString().padEnd(21)} │`);
    console.log(`│  Users skipped:  ${skippedUsers.toString().padEnd(21)} │`);
    console.log(`│  Total users:    ${usersToCreate.length.toString().padEnd(21)} │`);
    console.log('│                                         │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');

    if (createdUsers > 0) {
      console.log('🔐 CREATED ACCOUNTS:');
      console.log('');
      console.log('👥 USERS:');
      console.log('   user1@gmail.com / user123');
      console.log('   user2@gmail.com / user123');
      console.log('   user3@gmail.com / user123');
      console.log('   user4@gmail.com / user123');
      console.log('');
      console.log('👨‍💼 ADMINS:');
      console.log('   admin1@gmail.com / admin123');
      console.log('   admin2@gmail.com / admin123');
      console.log('   admin3@gmail.com / admin123');
      console.log('   admin4@gmail.com / admin123');
      console.log('');
      console.log('⚠️  NOTE: These are development accounts with simple passwords.');
      console.log('   Change passwords in production environment!');
    }

  } catch (error) {
    console.error('❌ Error in user seeder:', error.name || 'Unknown error');
    
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

// Function to create a single user
const createSingleUser = async (username, email, password, role = 'user', phone = null) => {
  try {
    console.log(`🚀 Creating ${role}: ${email}`);
    
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

    // Validate password
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long.');
      return false;
    }

    // Password akan di-hash otomatis oleh hook beforeCreate di model User

    // Create user
    const user = await User.create({
      username,
      email,
      password: password,
      no_telepon: phone,
      role: role,
      is_verified: true,
      verification_token: null,
      verification_token_expire: null
    });

    console.log(`✅ ${role.charAt(0).toUpperCase() + role.slice(1)} account "${username}" created successfully!`);
    return true;

  } catch (error) {
    console.error(`❌ Error creating ${role} "${username}":`, error.message);
    return false;
  }
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default user creation
    createInitialUsers();
  } else if (args[0] === 'single') {
    // Single user creation: node userSeeder.js single username email password [role] [phone]
    if (args.length < 4) {
      console.log('❌ Usage: node userSeeder.js single <username> <email> <password> [role] [phone]');
      console.log('   role: user or admin (default: user)');
      process.exit(1);
    }
    
    const [, username, email, password, role = 'user', phone] = args;
    
    if (!['user', 'admin'].includes(role)) {
      console.log('❌ Role must be either "user" or "admin"');
      process.exit(1);
    }
    
    createSingleUser(username, email, password, role, phone).then(() => {
      sequelize.close();
    });
  } else if (args[0] === 'generate-password') {
    // Generate secure password: node userSeeder.js generate-password [length]
    const length = parseInt(args[1]) || 16;
    const securePassword = generateSecurePassword(length);
    console.log(`🔐 Generated secure password: ${securePassword}`);
  } else if (args[0] === 'help') {
    console.log('🔧 User Seeder Commands:');
    console.log('');
    console.log('   node seeders/userSeeder.js                                    - Create all initial users');
    console.log('   node seeders/userSeeder.js single <user> <email> <pass>       - Create single user');
    console.log('   node seeders/userSeeder.js single <user> <email> <pass> admin - Create single admin');
    console.log('   node seeders/userSeeder.js generate-password [length]         - Generate secure password');
    console.log('   node seeders/userSeeder.js help                               - Show this help');
    console.log('');
    console.log('📝 Examples:');
    console.log('   node seeders/userSeeder.js');
    console.log('   node seeders/userSeeder.js single john john@example.com password123');
    console.log('   node seeders/userSeeder.js single admin admin@company.com adminpass admin');
    console.log('   node seeders/userSeeder.js generate-password 12');
  } else {
    console.log('❌ Invalid command. Use "node seeders/userSeeder.js help" for available commands.');
  }
}

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

module.exports = {
  createInitialUsers,
  createSingleUser,
  generateSecurePassword
};