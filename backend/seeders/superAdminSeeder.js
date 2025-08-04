const { User } = require('../models');
const bcrypt = require('bcryptjs');

const createSuperAdmin = async () => {
  try {
    console.log('🚀 Starting super admin seeder...');
    
    // FORCE DELETE existing super admin
    const existingSuperAdmin = await User.findOne({
      where: {
        email: 'adminsuper@admin.com'
      }
    });

    if (existingSuperAdmin) {
      console.log('🗑️ Deleting existing super admin...');
      await existingSuperAdmin.destroy();
      console.log('✅ Existing super admin deleted');
    }

    console.log('🆕 Creating fresh super admin...');
    
    // Create password hash manually (bypass model hooks)
    const plainPassword = 'adminsuper';
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('🔐 Password hashed manually');
    
    // Test hash
    const testResult = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('🧪 Hash test:', testResult ? '✅ VALID' : '❌ INVALID');
    
    if (!testResult) {
      throw new Error('Hash test failed!');
    }

    // Create super admin with raw query to bypass ALL model validations and hooks
    const [superAdmin] = await User.sequelize.query(`
      INSERT INTO users (username, email, password, no_telepon, role, is_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *;
    `, {
      replacements: [
        'Super Administrator',
        'adminsuper@admin.com',
        hashedPassword,
        '+62123456789',
        'super_admin',
        true,
        new Date()
      ],
      type: User.sequelize.QueryTypes.INSERT
    });

    console.log('✅ Super admin created with raw query (bypass all validations)');
    
    // Final verification
    const finalUser = await User.findOne({
      where: { email: 'adminsuper@admin.com' }
    });
    
    if (!finalUser) {
      throw new Error('User not found after creation!');
    }
    
    const finalTest = await bcrypt.compare(plainPassword, finalUser.password);
    console.log('🔍 Final verification:', finalTest ? '✅ VALID' : '❌ INVALID');
    
    console.log('📧 Email: adminsuper@admin.com');
    console.log('🔑 Password: adminsuper');
    console.log('👑 Role: super_admin');
    console.log('✓ Verified: true (bypassed email verification)');
    
    return finalUser;
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    
    // Try MySQL syntax if PostgreSQL fails
    if (error.message.includes('RETURNING')) {
      console.log('🔄 Trying MySQL syntax...');
      
      try {
        await User.sequelize.query(`
          INSERT INTO users (username, email, password, no_telepon, role, is_verified, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            'Super Administrator',
            'adminsuper@admin.com',
            hashedPassword,
            '+62123456789',
            'super_admin',
            true,
            new Date()
          ]
        });
        
        console.log('✅ Super admin created with MySQL syntax');
        
        const finalUser = await User.findOne({
          where: { email: 'adminsuper@admin.com' }
        });
        
        const finalTest = await bcrypt.compare('adminsuper', finalUser.password);
        console.log('🔍 Final verification:', finalTest ? '✅ VALID' : '❌ INVALID');
        
        return finalUser;
      } catch (mysqlError) {
        console.error('❌ MySQL syntax also failed:', mysqlError.message);
        throw mysqlError;
      }
    }
    
    throw error;
  }
};

// Run seeder
if (require.main === module) {
  createSuperAdmin()
    .then(() => {
      console.log('\n🎉 Super admin seeder completed successfully!');
      console.log('🔄 Please restart your backend server');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Super admin seeder failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createSuperAdmin };