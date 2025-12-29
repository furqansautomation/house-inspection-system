// src/app.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');
const { runSetup } = require('./utils/setupAdmin');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminOrgRoutes = require('./routes/adminOrganizationRoutes');  
const orgAuthRoutes = require('./routes/orgAuthRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
// const uploadRoutes = require('./routes/uploadRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'House Inspection System API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  let dbMessage = 'disconnected';

  if (dbStatus === 1) dbMessage = 'connected';
  else if (dbStatus === 2) dbMessage = 'connecting';
  else if (dbStatus === 3) dbMessage = 'disconnecting';

  res.status(200).json({
    status: 'OK',
    database: dbMessage,
    databaseName: mongoose.connection.name,
    timestamp: new Date().toISOString()
  });
});

// Test models route (remove later)
app.get('/test-models', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const models = {
      Organization: mongoose.modelNames().includes('Organization'),
      User: mongoose.modelNames().includes('User'),
      Inspection: mongoose.modelNames().includes('Inspection')
    };

    res.json({
      message: 'Models loaded successfully',
      models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes - Clean, Consistent v1 Structure
app.use('/v1/auth', authRoutes);                    // Login, register, profile, change-password
app.use('/v1/admin/api', adminOrgRoutes);           // Admin panel: orgs & users
app.use('/v1/org/api', orgAuthRoutes);              //   login
app.use('/v1/user/api', require('./routes/userRoutes'));  
app.use('/v1/inspections', inspectionRoutes); 

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    await runSetup();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`🔐 User Auth: http://localhost:${PORT}/api/auth`);
      console.log(`🔐 Org Login: http://localhost:${PORT}/v1/org/api/signin`);
      console.log(`🛡️ Admin Panel: http://localhost:${PORT}/v1/admin/api/organizations`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

startServer();