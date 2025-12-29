const { User, Organization } = require('../models');
const { generateToken } = require('../config/jwt'); 

const authController = {
  // Register a new user
  register: async (req, res) => {
    try {
      const { email, name, phone, designation, password, role, organizationId } = req.body;

      // Prevent public users from registering as admin or org-admin
      if (!req.userId || req.userRole !== 'admin') {
        return res.status(403).json({
        success: false,
        error: 'User registration is restricted. Only admin can create users.'
        });
    }

      // Check duplicate email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists.'
        });
      }

      let finalRole = role || 'user';
      let finalOrgId = organizationId;

      // Non-admin users must belong to an active organization
      if (finalRole !== 'admin') {
        if (!organizationId) {
          return res.status(400).json({
            success: false,
            error: 'Organization ID is required for non-admin users.'
          });
        }

        const org = await Organization.findById(organizationId);
        if (!org) {
          return res.status(400).json({
            success: false,
            error: 'Invalid organization ID.'
          });
        }
        if (!org.status) {
          return res.status(403).json({
            success: false,
            error: 'Cannot register user for inactive organization.'
          });
        }
      } else {
        finalOrgId = null; // Admins have no organization
      }

      const newUser = new User({
        email,
        name,
        phone,
        designation,
        password,
        role: finalRole,
        organizationId: finalOrgId,
        createdBy: req.userId || null
      });

      await newUser.save();

      const token = generateToken({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId
      });

      const userResponse = newUser.toSafeObject();

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: { user: userResponse, token }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required.'
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated. Please contact administrator.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials.'
        });
      }

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      });

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data without password
      const userResponse = user.toSafeObject();

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile.'
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, phone, designation } = req.body;
      
      const updates = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (designation) updates.designation = designation;

      const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile.'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters.'
        });
      }

      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect.'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password.'
      });
    }
  },

  // get profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId)
        .populate('organizationId', 'name logo status contactPerson organization')
        .populate('createdBy', 'name email role')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }

      res.json({
        success: true,
        message: 'Profile fetched successfully.',
        data: {
          user: user.toSafeObject ? user.toSafeObject() : user,
          organization: user.organizationId ? {
            _id: user.organizationId._id,
            name: user.organizationId.name,
            logo: user.organizationId.organization?.logo || null,
            status: user.organizationId.status,
            contactPerson: user.organizationId.contactPerson,
            organizationContact: user.organizationId.organization
          } : null,
          createdBy: user.createdBy ? {
            _id: user.createdBy._id,
            name: user.createdBy.name,
            email: user.createdBy.email,
            role: user.createdBy.role
          } : null
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile.'
      });
    }
  },
};

module.exports = authController;