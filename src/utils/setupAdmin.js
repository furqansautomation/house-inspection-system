const { User } = require('../models');
require('dotenv').config();

const setupAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('✅ Admin user already exists.');
      console.log(`📧 Email: ${adminExists.email}`);
      return { exists: true, admin: adminExists };
    }

    const adminUser = new User({
      email: process.env.ADMIN_EMAIL || 'admin@inspect.com',
      name: process.env.ADMIN_NAME || 'System Administrator',
      phone: process.env.ADMIN_PHONE || '+1234567890',
      designation: 'System Administrator',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',  // Will be hashed automatically
      role: 'admin',
      organizationId: null,
      createdBy: null,
      isActive: true
    });

    await adminUser.save();
    
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('⚠️  IMPORTANT: Change the default password immediately!');
    
    return { exists: false, admin: adminUser };
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    throw error;  // Re-throw so server startup can fail gracefully if needed
  }
};

module.exports = {
  setupAdmin,
  runSetup: async () => {
    console.log('🔧 Setting up default admin user...');
    const result = await setupAdmin();
    return result;
  }
};