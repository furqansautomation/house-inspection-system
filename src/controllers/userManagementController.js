// src/controllers/userManagementController.js
const { User, Organization } = require('../models');
const { generateToken } = require('../config/jwt');

const userManagementController = {
  // Create user under specific organization (Admin or Org-Admin)
  createUserInOrg: async (req, res) => {
    try {
      const { orgId } = req.params;
      const { email, name, phone, designation, password, role } = req.body;

      // Check if organization exists and is active
      const org = await Organization.findById(orgId);
      if (!org) return res.status(404).json({ success: false, error: 'Organization not found.' });
      if (!org.status) return res.status(403).json({ success: false, error: 'Organization is inactive.' });

      // Role check: only admin or org-admin of THIS org can create users here
      if (req.userRole !== 'admin' && (req.organizationId?.toString() !== orgId || req.userRole !== 'org-admin')) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      // Prevent creating admin via this route
      if (role === 'admin') {
        return res.status(403).json({ success: false, error: 'Cannot create admin users here.' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ success: false, error: 'Email already exists.' });

      const newUser = new User({
        email,
        name,
        phone,
        designation,
        password,
        role: role || 'user',
        organizationId: orgId,
        createdBy: req.userId
      });

      await newUser.save();

      const token = generateToken({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: {
          user: newUser.toSafeObject(),
          token
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Failed to create user.' });
    }
  },

  // List users in a specific organization
  getUsersInOrg: async (req, res) => {
    try {
      const { orgId } = req.params;

      const org = await Organization.findById(orgId);
      if (!org) return res.status(404).json({ success: false, error: 'Organization not found.' });

      if (req.userRole !== 'admin' && (req.organizationId?.toString() !== orgId)) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      const users = await User.find({ organizationId: orgId })
        .populate('createdBy', 'name role')
        .select('-password')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch users.' });
    }
  },

  // Toggle user status - Admin or Org-Admin
    toggleUserStatus: async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Permission
        const isAdmin = req.userRole === 'admin';
        const isOrgAdminSameOrg = req.userRole === 'org-admin' && 
            req.organizationId?.toString() === user.organizationId?.toString();

        if (!isAdmin && !isOrgAdminSameOrg) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
        }

        if (user.role === 'admin') {
        return res.status(403).json({ success: false, error: 'Cannot toggle admin status.' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
        data: { isActive: user.isActive }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to toggle status.' });
    }
    },

    // Permanent hard delete user - Admin or Org-Admin
    permanentDeleteUser: async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Permission
        const isAdmin = req.userRole === 'admin';
        const isOrgAdminSameOrg = req.userRole === 'org-admin' && 
            req.organizationId?.toString() === user.organizationId?.toString();

        if (!isAdmin && !isOrgAdminSameOrg) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
        }

        if (user.role === 'admin') {
        return res.status(403).json({ success: false, error: 'Cannot permanently delete admin users.' });
        }

        await User.findByIdAndDelete(userId);

        res.json({
        success: true,
        message: 'User permanently deleted.'
        });
    } catch (error) {   
        res.status(500).json({ success: false, error: 'Failed to delete user.' });
    }
    }
};

module.exports = userManagementController;