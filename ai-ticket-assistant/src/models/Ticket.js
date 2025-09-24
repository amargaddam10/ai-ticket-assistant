const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'resolved', 'closed', 'escalated'],
        message:
          'Status must be one of: open, in-progress, resolved, closed, escalated',
      },
      default: 'open',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be one of: low, medium, high, urgent',
      },
      default: 'medium',
    },
    type: {
      type: String,
      enum: {
        values: [
          'technical',
          'billing',
          'feature-request',
          'bug-report',
          'general',
          'account',
        ],
        message:
          'Type must be one of: technical, billing, feature-request, bug-report, general, account',
      },
      default: 'general',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    aiNotes: {
      type: String,
      maxlength: [2000, 'AI notes cannot exceed 2000 characters'],
    },
    aiResponse: {
      type: String,
      maxlength: [2000, 'AI response cannot exceed 2000 characters'],
    },
    aiProcessed: {
      type: Boolean,
      default: false,
    },
    aiProcessedAt: {
      type: Date,
    },
    aiProcessingError: {
      type: String,
      maxlength: [500, 'AI processing error cannot exceed 500 characters'],
    },
    resolution: {
      type: String,
      maxlength: [2000, 'Resolution cannot exceed 2000 characters'],
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    escalatedAt: {
      type: Date,
    },
    estimatedResolutionTime: {
      type: Number, // in hours
      min: [0.5, 'Estimated resolution time must be at least 0.5 hours'],
      max: [720, 'Estimated resolution time cannot exceed 720 hours (30 days)'],
    },
    actualResolutionTime: {
      type: Number, // in hours
    },
    customerSatisfactionRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, 'Tags cannot exceed 30 characters'],
      },
    ],
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
          max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'], // 10MB limit
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: [true, 'Comment content is required'],
          trim: true,
          maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        isInternal: {
          type: Boolean,
          default: false, // Internal comments are only visible to moderators and admins
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },
    slaDueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ type: 1 });
ticketSchema.index({ requiredSkills: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ lastActivity: -1 });
ticketSchema.index({ slaDueDate: 1 });
ticketSchema.index({ tags: 1 });

// Compound indexes
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ createdBy: 1, status: 1 });

// Virtual for age of ticket in hours
ticketSchema.virtual('ageInHours').get(function () {
  return Math.round((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Virtual for time until SLA breach
ticketSchema.virtual('timeUntilSlaBreach').get(function () {
  if (!this.slaDueDate) return null;
  const timeDiff = this.slaDueDate.getTime() - Date.now();
  return Math.max(0, Math.round(timeDiff / (1000 * 60 * 60))); // in hours
});

// Virtual for checking if ticket is overdue
ticketSchema.virtual('isOverdue').get(function () {
  if (!this.slaDueDate) return false;
  return Date.now() > this.slaDueDate.getTime();
});

// Pre-save middleware to update lastActivity
ticketSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivity = new Date();
  }
  next();
});

// Pre-save middleware to set resolution times
ticketSchema.pre('save', function (next) {
  // Set resolved timestamp when status changes to resolved
  if (
    this.isModified('status') &&
    this.status === 'resolved' &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
    this.actualResolutionTime = this.ageInHours;
  }

  // Set closed timestamp when status changes to closed
  if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }

  // Set escalated timestamp when status changes to escalated
  if (
    this.isModified('status') &&
    this.status === 'escalated' &&
    !this.escalatedAt
  ) {
    this.escalatedAt = new Date();
  }

  next();
});

// Pre-save middleware to calculate SLA due date
ticketSchema.pre('save', function (next) {
  if (this.isNew && !this.slaDueDate) {
    const slaHours = this.getSlaHours();
    this.slaDueDate = new Date(Date.now() + slaHours * 60 * 60 * 1000);
  }
  next();
});

// Instance method to get SLA hours based on priority
ticketSchema.methods.getSlaHours = function () {
  const slaMap = {
    urgent: 4, // 4 hours
    high: 24, // 1 day
    medium: 72, // 3 days
    low: 168, // 7 days
  };
  return slaMap[this.priority] || 72;
};

// Instance method to add comment
ticketSchema.methods.addComment = function (
  authorId,
  content,
  isInternal = false
) {
  this.comments.push({
    author: authorId,
    content: content.trim(),
    isInternal: isInternal,
  });
  return this.save();
};

// Instance method to assign ticket
ticketSchema.methods.assignTo = function (userId) {
  this.assignedTo = userId;
  if (this.status === 'open') {
    this.status = 'in-progress';
  }
  return this.save();
};

// Instance method to check SLA breach
ticketSchema.methods.checkSlaBreach = function () {
  if (
    this.slaDueDate &&
    Date.now() > this.slaDueDate.getTime() &&
    !this.slaBreached
  ) {
    this.slaBreached = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find tickets by skills
ticketSchema.statics.findBySkills = function (skills, options = {}) {
  const query = {
    status: { $in: ['open', 'in-progress'] },
    requiredSkills: { $in: skills },
    ...options,
  };

  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

// Static method to find unassigned tickets
ticketSchema.statics.findUnassigned = function () {
  return this.find({
    assignedTo: null,
    status: 'open',
  })
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

// Static method to find tickets near SLA breach
ticketSchema.statics.findNearSlaBreach = function (hoursThreshold = 2) {
  const thresholdTime = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);

  return this.find({
    status: { $in: ['open', 'in-progress'] },
    slaDueDate: { $lte: thresholdTime },
    slaBreached: { $ne: true },
  })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ slaDueDate: 1 });
};

// Static method for analytics
ticketSchema.statics.getAnalytics = function (startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        byStatus: {
          $push: {
            status: '$status',
            count: 1,
          },
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1,
          },
        },
        avgResolutionTime: { $avg: '$actualResolutionTime' },
        slaBreaches: {
          $sum: { $cond: ['$slaBreached', 1, 0] },
        },
      },
    },
  ]);
};

module.exports = mongoose.model('Ticket', ticketSchema);
