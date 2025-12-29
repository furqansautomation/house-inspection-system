// src/controllers/organizationController.js

const { Organization, User } = require('../models');

const organizationController = {
  createOrganization: async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { organizationname, password, contactPerson, organization } = req.body;

    // Parse nested JSON if sent as string (common in form-data)
    let parsedContactPerson = contactPerson;
    let parsedOrganization = organization;
    if (typeof contactPerson === 'string') parsedContactPerson = JSON.parse(contactPerson);
    if (typeof organization === 'string') parsedOrganization = JSON.parse(organization);

    if (!organizationname || !password || !parsedContactPerson || !parsedOrganization) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const existingOrg = await Organization.findOne({ organizationname });
    if (existingOrg) {
      return res.status(400).json({ success: false, error: 'Organization name already exists.' });
    }

    // Handle logo upload
    let logoUrl = null;
    if (req.file) {
      logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (parsedOrganization.logo) {
      logoUrl = parsedOrganization.logo; // Keep string URL if provided
    }

    const newOrg = new Organization({
      organizationname,
      password,
      contactPerson: parsedContactPerson,
      organization: {
        ...parsedOrganization,
        logo: logoUrl
      },
      createdBy: req.userId
    });

    await newOrg.save();

    res.status(201).json({
      success: true,
      message: 'Organization created successfully.',
      data: {
        _id: newOrg._id,
        organizationname: newOrg.organizationname,
        contactPerson: newOrg.contactPerson,
        organization: newOrg.organization,
        status: newOrg.status,
        createdAt: newOrg.createdAt,
        password // plain password once
      }
    });
  } catch (error) {
      console.error('Create organization error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: messages
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create organization.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Admin only: List all organizations
  getAllOrganizations: async (req, res) => {
    try {
      const organizations = await Organization.find({})
        .sort({ createdAt: -1 })
        .select('-__v');

      res.json({
        success: true,
        count: organizations.length,
        data: organizations
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch organizations.' });
    }
  },

  getOrganizationById: async (req, res) => {
  try {
    const { id } = req.params;

    const org = await Organization.findById(id)
      .select('-password -__v'); // Never return password

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found.'
      });
    }

    res.json({
      success: true,
      data: org
    });
  } catch (error) {
    console.error('Get organization by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization.'
    });
  }
},

  // Admin only: Update organization
  updateOrganization: async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    // Parse JSON strings if needed
    if (typeof updates.contactPerson === 'string') updates.contactPerson = JSON.parse(updates.contactPerson);
    if (typeof updates.organization === 'string') updates.organization = JSON.parse(updates.organization);

    // Handle new logo upload
    if (req.file) {
      const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      if (!updates.organization) updates.organization = {};
      updates.organization.logo = logoUrl;
    }

    const org = await Organization.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found.' });
    }

    res.json({
      success: true,
      message: 'Organization updated successfully.',
      data: org
    });
  } catch (error) {
      res.status(500).json({ success: false, error: 'Update failed.' });
    }
  },

  // Admin only: Deactivate / Activate (soft delete)
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const org = await Organization.findById(id);

      if (!org) {
        return res.status(404).json({ success: false, error: 'Organization not found.' });
      }

      org.status = !org.status;
      await org.save();

      res.json({
        success: true,
        message: `Organization ${org.status ? 'activated' : 'deactivated'} successfully.`,
        data: org
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Status toggle failed.' });
    }
  },

  // Permanent delete organization - Admin only
  deleteOrganization: async (req, res) => {
    try {
      const { id } = req.params;

      // First, find the organization to confirm it exists
      const org = await Organization.findById(id);
      if (!org) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found.'
        });
      }

      // Permanently delete all users in this organization
      await User.deleteMany({ organizationId: id });

      // Permanently delete the organization
      await Organization.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Organization and all its associated users have been permanently deleted.'
      });
    } catch (error) {
      console.error('Hard delete organization error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to delete organization.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = organizationController;