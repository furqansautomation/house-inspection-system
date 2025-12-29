const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Public routes
// router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

// Admin-only route to create users (for admin)
router.post('/admin/create-user', authMiddleware, requireRole('admin'), authController.register);

// Test route for middleware (temporary)
router.get('/test-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful!',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      organizationId: req.user.organizationId
    }
  });
});

module.exports = router;