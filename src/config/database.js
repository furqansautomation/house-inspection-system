// config/database.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from previous DB');
    }

    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inspect_db';

    await mongoose.connect(mongoUri, {
      // Recommended options
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MongoDB connected');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;