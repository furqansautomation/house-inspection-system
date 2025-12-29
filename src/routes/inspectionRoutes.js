// src/routes/inspectionRoutes.js

const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Normal user routes – uses /my/*
router.post('/my/inspections', authMiddleware, inspectionController.createMyInspection);
router.get('/my/inspections', authMiddleware, inspectionController.getMyInspections);

// Single inspection view (accessible by owner or higher)
router.get('/inspections/:id', authMiddleware, inspectionController.getInspectionById);

// Org-Admin & Admin: View all inspections in organization
router.get('/organizations/:orgId/inspections', 
  authMiddleware, 
  requireRole('admin', 'org-admin'), 
  inspectionController.getAllInspectionsInOrg
);

module.exports = router;