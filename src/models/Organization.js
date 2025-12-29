const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const User = require('./User');

const organizationSchema = new Schema({
  // Organization details
  organizationname: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters'],
    unique: true
  },

  password: {  
    type: String,
    required: [true, 'Password is required for organization login'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // Contact person details
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Contact person email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      trim: true
    }
  },
  
  // Organization contact details
  organization: {
    email: {
      type: String,
      required: [true, 'Organization email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Organization phone is required'],
      trim: true
    },
    logo: {
      type: String,
      default: null,
      trim: true
    }
  },
  
  // Status - controls API access
  status: {
    type: Boolean,
    default: true,
    required: true
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',  
    required: true
  }
}, {
  timestamps: true
});

// MODERN: Password hashing - no next()
organizationSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// MODERN: Deactivate users when org status becomes false - no next()
organizationSchema.pre('save', async function() {
  if (this.isModified('status') && this.status === false) {
    await User.updateMany(
      { organizationId: this._id },
      { isActive: false }
    );
  }
});

// Method to compare password
organizationSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
organizationSchema.index({ organizationname: 1 }, { unique: true });
organizationSchema.index({ status: 1 });
organizationSchema.index({ 'contactPerson.email': 1 });
organizationSchema.index({ 'organization.email': 1 });

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;