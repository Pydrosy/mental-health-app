// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,  // This creates an index automatically
//     lowercase: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true,
//     select: false
//   },
//   role: {
//     type: String,
//     enum: ['patient', 'therapist', 'admin'],
//     default: 'patient'
//   },
//   profile: {
//     firstName: {
//       type: String,
//       required: true
//     },
//     lastName: {
//       type: String,
//       required: true
//     },
//     dateOfBirth: Date,
//     gender: {
//       type: String,
//       enum: ['male', 'female', 'other', 'prefer-not-to-say']
//     },
//     phoneNumber: String,
//     profilePicture: {
//       type: String,
//       default: 'default-avatar.png'
//     },
//     bio: String,
//     preferredLanguage: {
//       type: String,
//       default: 'English'
//     }
//   },
//   // Patient specific fields (all optional)
//   patientDetails: {
//     concerns: [String],
//     therapyGoals: [String],
//     preferredTherapyType: [String],
//     insuranceProvider: String,
//     insuranceId: String,
//     emergencyContact: {
//       name: String,
//       relationship: String,
//       phone: String
//     },
//     previousTherapy: {
//       type: Boolean,
//       default: false
//     },
//     currentMedication: String,
//     medicalConditions: [String],
//     lastTherapyDate: Date
//   },
//   // Therapist specific fields (all optional)
//   therapistDetails: {
//     specializations: [String],
//     licenseNumber: String,
//     licenseType: String,
//     licenseExpiry: Date,
//     yearsOfExperience: Number,
//     education: [{
//       degree: String,
//       institution: String,
//       year: Number
//     }],
//     certifications: [{
//       name: String,
//       issuedBy: String,
//       year: Number
//     }],
//     languages: [String],
//     sessionRate: Number,
//     acceptsInsurance: Boolean,
//     insuranceAccepted: [String],
//     availability: [{
//       day: String,
//       slots: [{
//         startTime: String,
//         endTime: String,
//         isBooked: Boolean
//       }]
//     }],
//     averageRating: {
//       type: Number,
//       default: 0
//     },
//     totalSessions: {
//       type: Number,
//       default: 0
//     },
//     isVerified: {
//       type: Boolean,
//       default: false
//     },
//     isAvailable: {
//       type: Boolean,
//       default: true
//     }
//   },
//   // Account management
//   isEmailVerified: {
//     type: Boolean,
//     default: true  // Auto-verified for development
//   },
//   emailVerificationToken: String,
//   emailVerificationExpires: Date,
//   passwordResetToken: String,
//   passwordResetExpires: Date,
//   lastLogin: Date,
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockUntil: Date,
//   isActive: {
//     type: Boolean,
//     default: true  // IMPORTANT: This must be true for new accounts
//   },
//   deactivatedAt: Date,
//   deactivatedReason: String
// }, {
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true }
// });

// // Virtual for full name
// userSchema.virtual('fullName').get(function() {
//   return `${this.profile.firstName} ${this.profile.lastName}`;
// });

// // PROMISE-BASED PRE-SAVE HOOK - WORKING VERSION
// userSchema.pre('save', function() {
//   return new Promise((resolve, reject) => {
//     console.log('📝 Pre-save hook running for:', this.email);
    
//     if (!this.isModified('password')) {
//       console.log('Password not modified, skipping hash');
//       return resolve();
//     }
    
//     try {
//       console.log('Hashing password...');
//       const salt = bcrypt.genSaltSync(10);
//       this.password = bcrypt.hashSync(this.password, salt);
//       console.log('✅ Password hashed successfully');
//       resolve();
//     } catch (error) {
//       console.error('❌ Error hashing password:', error);
//       reject(error);
//     }
//   });
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Check if account is locked
// userSchema.methods.isLocked = function() {
//   return !!(this.lockUntil && this.lockUntil > Date.now());
// };

// // Simple indexes for performance - REMOVED DUPLICATE EMAIL INDEX
// userSchema.index({ role: 1 });
// userSchema.index({ isActive: 1 });
// userSchema.index({ 'therapistDetails.specializations': 1 });
// userSchema.index({ 'therapistDetails.averageRating': -1 });

// const User = mongoose.model('User', userSchema);

// module.exports = User;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'therapist', 'admin'],
    default: 'patient'
  },
  profile: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    phoneNumber: String,
    profilePicture: {
      type: String,
      default: 'default-avatar.png'
    },
    bio: String,
    preferredLanguage: {
      type: String,
      default: 'English'
    }
  },
  patientDetails: {
    concerns: [String],
    therapyGoals: [String],
    preferredTherapyType: [String],
    insuranceProvider: String,
    insuranceId: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    previousTherapy: {
      type: Boolean,
      default: false
    },
    currentMedication: String,
    medicalConditions: [String],
    lastTherapyDate: Date
  },
  therapistDetails: {
    specializations: [String],
    licenseNumber: String,
    licenseType: String,
    licenseExpiry: Date,
    yearsExperience: {
      type: Number,
      default: 0
    },
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    certifications: [{
      name: String,
      issuedBy: String,
      year: Number
    }],
    languages: [String],
    sessionRate: {
      type: Number,
      default: 0
    },
    acceptsInsurance: {
      type: Boolean,
      default: false
    },
    insuranceAccepted: [String],
    availability: [{
      day: String,
      slots: [{
        startTime: String,
        endTime: String,
        isBooked: {
          type: Boolean,
          default: false
        }
      }]
    }],
    averageRating: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ================ SIMPLEST PRE-SAVE HOOK - NO NEXT PARAMETER ================
userSchema.pre('save', function() {
  console.log('📝 Pre-save hook triggered for:', this.email);
  
  // If password is not modified, skip hashing
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return;
  }

  console.log('Hashing password...');
  
  try {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
    console.log('✅ Password hashed successfully');
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    throw error;
  }
});
// ============================================================================

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    throw error;
  }
};

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'therapistDetails.specializations': 1 });
userSchema.index({ 'therapistDetails.averageRating': -1 });
userSchema.index({ 'therapistDetails.isAvailable': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;