// src/controllers/orgAuthController.js

const { Organization } = require('../models');
const { generateToken } = require('../config/jwt');

const orgAuthController = {
  signin: async (req, res) => {
    try {
        const { organizationname, password } = req.body;

        if (!organizationname || !password) {
            return res.status(400).json({
            success: false,
            error: 'Organization name and password are required.'
            });
        }

        console.log('Looking for org:', organizationname);
        const org = await Organization.findOne({ organizationname });
        console.log('Found org:', org ? 'Yes' : 'No');     
        
        if (org) {
            console.log('Stored hashed password:', org.password);
            const isValid = await org.comparePassword(password);
            console.log('Password valid?', isValid);
        }

        if (!org) {
            return res.status(401).json({
            success: false,
            error: 'Invalid credentials.'
            });
        }

        if (!org.status) {
            return res.status(403).json({
            success: false,
            error: 'Organization is inactive.'
            });
        }

        const isValid = await org.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({
            success: false,
            error: 'Invalid credentials.'
            });
        }

        const token = generateToken({
            orgId: org._id,
            organizationname: org.organizationname,
            role: 'organization'  // Special role for org login
        });

      res.json({
        success: true,
        message: 'Organization login successful.',
        data: {
          organization: {
            _id: org._id,
            organizationname: org.organizationname,
            contactPerson: org.contactPerson,
            organization: org.organization,
            status: org.status
          },
          token
        }
      });
    } catch (error) {
      console.error('Org login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed.'
      });
    }
  }
};

module.exports = orgAuthController;