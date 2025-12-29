// src/controllers/inspectionController.js

const { Inspection, Organization } = require('../models');

const inspectionController = {
  // Normal user creates their own inspection
  createMyInspection: async (req, res) => {
    try {
      const { room1, room2, kitchen, notes, overallRating } = req.body;

    let parsedRoom1 = typeof room1 === 'string' ? JSON.parse(room1) : room1;
    let parsedRoom2 = typeof room2 === 'string' ? JSON.parse(room2) : room2;
    let parsedKitchen = typeof kitchen === 'string' ? JSON.parse(kitchen) : kitchen;

    const buildImages = (prefix) => ({
      floor: req.files[`${prefix}_floor`]?.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) || [],
      wall: req.files[`${prefix}_wall`]?.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) || [],
      switch: req.files[`${prefix}_switch`]?.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) || [],
      window: req.files[`${prefix}_window`]?.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) || [],
      door: req.files[`${prefix}_door`]?.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) || []
    });

      // Normal users can only create for themselves
      const newInspection = new Inspection({
        userId: req.userId,                    // The house owner / tenant
        organizationId: req.organizationId,
        room1: {
        ...parsedRoom1,
        images: buildImages('room1')
      },
      room2: {
        ...parsedRoom2,
        images: buildImages('room2')
      },
      kitchen: {
        ...parsedKitchen,
        images: {
          ...buildImages('kitchen'),
          stove: req.files['kitchen_stove']?.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`) || []
        }
      },
      notes: notes || '',
        overallRating,                         // Optional: can be auto-calculated in pre-save
        inspectedBy: req.userId                 // The person doing inspection (current user)
      });

      await newInspection.save();

      // Populate useful info
      await newInspection.populate([
        { path: 'userId', select: 'name email phone' },
        { path: 'inspectedBy', select: 'name email' },
        { path: 'organizationId', select: 'name status' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Inspection created successfully.',
        data: newInspection
      });
    } catch (error) {
      console.error('Create inspection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create inspection.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all inspections belonging to the current user
  getMyInspections: async (req, res) => {
    try {
      const inspections = await Inspection.find({ userId: req.userId })
        .populate('inspectedBy', 'name email')
        .populate('organizationId', 'name')
        .sort({ inspectionDate: -1 });

      res.json({
        success: true,
        count: inspections.length,
        data: inspections
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch inspections.' });
    }
  },

  // Get single inspection (only if user owns it or has higher access)
  getInspectionById: async (req, res) => {
    try {
        const { id } = req.params;

        // Populate everything EXCEPT userId for ownership check - use raw userId instead
        const inspection = await Inspection.findById(id)
        .populate('inspectedBy', 'name email')
        .populate('organizationId', 'organizationname')
        .populate({
            path: 'userId',
            select: 'name email phone'  // Only populate for response, not for check
        });

        if (!inspection) {
        return res.status(404).json({
            success: false,
            error: 'Inspection not found.'
        });
        }

        // SAFE ownership check using raw ObjectId field (before populate)
        const isOwner = inspection.userId.toString() === req.userId;

        // Safe org check
        const isOrgAdminOrAdmin = ['org-admin', 'admin'].includes(req.userRole);
        const isSameOrg = req.organizationId && 
        inspection.organizationId._id.toString() === req.organizationId.toString();

        if (isOwner || (isOrgAdminOrAdmin && isSameOrg)) {
        return res.json({
            success: true,
            data: inspection
        });
        }

        return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to view this inspection.'
        });

    } catch (error) {
        console.error('Get inspection by ID error:', error);
        res.status(500).json({
        success: false,
        error: 'Failed to fetch inspection.'
        });
    }
    },

  // Org-Admin or Admin: Get all inspections in their organization
  getAllInspectionsInOrg: async (req, res) => {
    try {
      const { orgId } = req.params;

      // Validate org
      const org = await Organization.findById(orgId);
      if (!org) return res.status(404).json({ success: false, error: 'Organization not found.' });

      // Access control
      if (req.userRole !== 'admin' && req.organizationId?.toString() !== orgId) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      const inspections = await Inspection.find({ organizationId: orgId })
        .populate('userId', 'name email phone')
        .populate('inspectedBy', 'name email')
        .sort({ inspectionDate: -1 });

      res.json({
        success: true,
        count: inspections.length,
        data: inspections
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch inspections.' });
    }
  }
};

module.exports = inspectionController;