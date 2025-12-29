// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const upload = require('../middleware/upload');  // ← Import multer upload middleware

const uploadInspectionImages = upload.fields([
  { name: 'room1_floor', maxCount: 5 },
  { name: 'room1_wall', maxCount: 5 },
  { name: 'room1_switch', maxCount: 5 },
  { name: 'room1_window', maxCount: 5 },
  { name: 'room1_door', maxCount: 5 },
  { name: 'room2_floor', maxCount: 5 },
  { name: 'room2_wall', maxCount: 5 },
  { name: 'room2_switch', maxCount: 5 },
  { name: 'room2_window', maxCount: 5 },
  { name: 'room2_door', maxCount: 5 },
  { name: 'kitchen_floor', maxCount: 5 },
  { name: 'kitchen_wall', maxCount: 5 },
  { name: 'kitchen_switch', maxCount: 5 },
  { name: 'kitchen_window', maxCount: 5 },
  { name: 'kitchen_door', maxCount: 5 },
  { name: 'kitchen_stove', maxCount: 5 }
]);

// Personal user actions
// router.post('/inspections', authMiddleware, inspectionController.createMyInspection);
router.post('/inspections', authMiddleware, uploadInspectionImages, inspectionController.createMyInspection);
router.get('/inspections', authMiddleware, inspectionController.getMyInspections);
router.get('/inspections/:id', authMiddleware, inspectionController.getInspectionById);

// Profile (already in auth, but we can move or keep duplicate if needed)
// Optional: router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;