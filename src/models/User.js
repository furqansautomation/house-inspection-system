const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                  // This creates the unique index automatically
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
    maxlength: [100, 'Designation cannot exceed 100 characters']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  role: {
    type: String,
    enum: ['admin', 'org-admin', 'user'],
    default: 'user',
    required: true
  },
  
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.role !== 'admin';
    }
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // Handles createdAt & updatedAt automatically
});

// FIXED: Async pre-save hook – NO next() needed
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // No next() call here!
  } catch (error) {
    throw error;  // Let Mongoose handle the error
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Safe object without password
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  // Always remove sensitive fields
  delete user.password;
  delete user.__v;

  // Admin should NOT see these fields
  if (user.role === 'admin') {
    delete user.organizationId;
    delete user.createdBy;
  }
  return user;
};

// Indexes (only the ones you really need – email is handled by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;