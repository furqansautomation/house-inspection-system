const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Common parameter schema for rooms/kitchen
const roomParameterSchema = new Schema({
  floor: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Not Applicable'],
    required: [true, 'Floor condition is required'],
    default: 'Fair'
  },
  wall: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Not Applicable'],
    required: [true, 'Wall condition is required'],
    default: 'Fair'
  },
  switch: {
    type: String,
    enum: ['Working', 'Not Working', 'Damaged', 'Missing', 'Not Applicable'],
    required: [true, 'Switch condition is required'],
    default: 'Working'
  },
  window: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Missing', 'Not Applicable'],
    required: [true, 'Window condition is required'],
    default: 'Fair'
  },
  door: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Missing', 'Locking', 'Not Locking', 'Not Applicable'],
    required: [true, 'Door condition is required'],
    default: 'Fair'
  },
  images: {
    floor: [{ type: String }],     // array of image URLs
    wall: [{ type: String }],
    switch: [{ type: String }],
    window: [{ type: String }],
    door: [{ type: String }]
  }
}, { _id: false });

// Kitchen specific schema (extends room parameters)
const kitchenParameterSchema = new Schema({
  ...roomParameterSchema.obj, // Include all room parameters
  stove: {
    type: String,
    enum: ['Working', 'Not Working', 'Damaged', 'Missing', 'Not Applicable'],
    required: [true, 'Stove condition is required'],
    default: 'Working'
  },
  images: {
    ...roomParameterSchema.obj.images,
    stove: [{ type: String }]
  }
}, { _id: false });

const inspectionSchema = new Schema({
  // References
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  
  // Room inspections
  room1: {
    type: roomParameterSchema,
    required: [true, 'Room 1 inspection data is required']
  },
  room2: {
    type: roomParameterSchema,
    required: [true, 'Room 2 inspection data is required']
  },
  kitchen: {
    type: kitchenParameterSchema,
    required: [true, 'Kitchen inspection data is required']
  },
  
  // Additional details
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  overallRating: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    default: 'Fair'
  },
  
  // Audit fields
  inspectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inspector ID is required']
  },
  
  // Timestamps
  inspectionDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  } 
}, {
  timestamps: true  /*{ createdAt: true, updatedAt: true } */
});

// Keep the pre-save for overallRating calculation
inspectionSchema.pre('save', function() {
  const conditions = [
    this.room1.floor, this.room1.wall, this.room1.switch, this.room1.window, this.room1.door,
    this.room2.floor, this.room2.wall, this.room2.switch, this.room2.window, this.room2.door,
    this.kitchen.floor, this.kitchen.wall, this.kitchen.switch, this.kitchen.window, this.kitchen.door, this.kitchen.stove
  ];
  
  const poorCount = conditions.filter(c => 
    ['Poor', 'Damaged', 'Missing', 'Not Working', 'Not Locking'].includes(c)
  ).length;

  const excellentCount = conditions.filter(c => c === 'Excellent').length;
  const goodCount = conditions.filter(c => c === 'Good').length;

  if (poorCount > 5) this.overallRating = 'Critical';
  else if (poorCount > 2) this.overallRating = 'Poor';
  else if (excellentCount > 10) this.overallRating = 'Excellent';
  else if (goodCount > 10 || excellentCount > 5) this.overallRating = 'Good';
  else this.overallRating = 'Fair';
  
});

// Indexes (keep only most useful to avoid index limit)
inspectionSchema.index({ userId: 1 });
inspectionSchema.index({ organizationId: 1 });
inspectionSchema.index({ inspectedBy: 1 });
inspectionSchema.index({ inspectionDate: -1 });
inspectionSchema.index({ overallRating: 1 });

const Inspection = mongoose.model('Inspection', inspectionSchema);
module.exports = Inspection;