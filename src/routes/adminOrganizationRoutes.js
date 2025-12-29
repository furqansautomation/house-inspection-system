// src/routes/adminOrganizationRoutes.js

const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const userManagementController = require('../controllers/userManagementController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/organizations', authMiddleware, requireRole('admin'), upload.single('logo'), organizationController.createOrganization);
router.get('/organizations', authMiddleware, requireRole('admin'), organizationController.getAllOrganizations);
router.get('/organizations/:id', authMiddleware, requireRole('admin'), organizationController.getOrganizationById);
router.put('/organizations/:id', authMiddleware, requireRole('admin'), upload.single('logo'), organizationController.updateOrganization);
router.patch('/organizations/:id/toggle-status', authMiddleware, requireRole('admin'), organizationController.toggleStatus);
router.delete('/organizations/:id', authMiddleware, requireRole('admin'), organizationController.deleteOrganization);

router.post('/organizations/:orgId/users', authMiddleware, requireRole('admin'), userManagementController.createUserInOrg);
router.get('/organizations/:orgId/users', authMiddleware, requireRole('admin', 'org-admin'), userManagementController.getUsersInOrg);
router.patch('/organizations/:orgId/users/:userId/toggle-status', authMiddleware, requireRole('admin', 'org-admin'), userManagementController.toggleUserStatus);
router.delete('/organizations/:orgId/users/:userId/permanent', authMiddleware, requireRole('admin', 'org-admin'), userManagementController.permanentDeleteUser);

module.exports = router;