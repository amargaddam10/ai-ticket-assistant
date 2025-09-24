const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'moderator', 'admin'],
        message: 'Role must be either user, moderator, or admin',
      },
      default: 'user',
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (v) {
            return v.length >= 2 && v.length <= 30;
          },
          message: 'Skills must be between 2 and 30 characters long',
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false, // Don't include in queries by default
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ isActive: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to normalize skills
userSchema.pre('save', function (next) {
  if (this.isModified('skills')) {
    // Remove duplicates and empty strings
    this.skills = [
      ...new Set(this.skills.filter((skill) => skill && skill.trim())),
    ];
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = async function () {
  const maxAttempts = 5;
  const lockoutTime = 2 * 60 * 60 * 1000; // 2 hours

  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        failedLoginAttempts: 1,
        lockUntil: 1,
      },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // If we just hit max attempts and we're not locked, lock account
  if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockoutTime };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $unset: {
      failedLoginAttempts: 1,
      lockUntil: 1,
    },
    $set: {
      lastLogin: new Date(),
    },
  });
};

// Instance method to add skills
userSchema.methods.addSkills = function (newSkills) {
  const currentSkills = new Set(this.skills);
  newSkills.forEach((skill) => {
    if (skill && skill.trim()) {
      currentSkills.add(skill.toLowerCase().trim());
    }
  });
  this.skills = Array.from(currentSkills);
  return this.save();
};

// Instance method to remove skills
userSchema.methods.removeSkills = function (skillsToRemove) {
  const skillsSet = new Set(skillsToRemove.map((s) => s.toLowerCase().trim()));
  this.skills = this.skills.filter((skill) => !skillsSet.has(skill));
  return this.save();
};

userSchema.statics.findModeratorsBySkills = function (requiredSkills) {
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return this.find({ role: 'moderator', isActive: true });
  }

  // Fixed regex usage
  const skillQueries = requiredSkills.map((skill) => ({
    skills: { $regex: new RegExp(skill, 'i') },
  }));

  return this.find({
    role: 'moderator',
    isActive: true,
    $or: skillQueries,
  }).sort({ updatedAt: -1 });
};

// Fix the findAvailableAdmins method
userSchema.statics.findAvailableAdmins = function () {
  return this.find({
    role: 'admin',
    isActive: true,
  }).sort({ lastLogin: -1 });
};

// Static method for safe user data projection
userSchema.statics.getPublicFields = function () {
  return {
    password: 0,
    resetPasswordToken: 0,
    resetPasswordExpire: 0,
    failedLoginAttempts: 0,
    lockUntil: 0,
    __v: 0,
  };
};

module.exports = mongoose.model('User', userSchema);
