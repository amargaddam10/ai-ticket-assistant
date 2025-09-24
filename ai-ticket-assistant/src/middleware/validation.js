const { body, param, query, validationResult } = require('express-validator');

// Simple error formatter
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Pagination validation - make it simple and safe
const validatePagination = (req, res, next) => {
  try {
    // Set safe defaults
    req.query.page = Math.max(1, parseInt(req.query.page) || 1);
    req.query.limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    // Ensure sortBy is safe
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'priority',
      'status',
    ];
    if (req.query.sortBy && !allowedSortFields.includes(req.query.sortBy)) {
      req.query.sortBy = 'createdAt';
    }

    // Ensure sortDir is safe
    if (
      req.query.sortDir &&
      !['asc', 'desc'].includes(req.query.sortDir.toLowerCase())
    ) {
      req.query.sortDir = 'desc';
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
    });
  }
};

// Ticket ID validation
const validateTicketIdParam = (req, res, next) => {
  try {
    const ticketId = req.params.id;

    // Basic MongoDB ObjectId check (24 hex characters)
    if (!ticketId || !/^[0-9a-fA-F]{24}$/.test(ticketId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID format',
      });
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid ticket ID',
    });
  }
};

// Simple input sanitization
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      // Basic string sanitization
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    next();
  } catch (error) {
    next(); // Don't fail the request if sanitization fails
  }
};

// Auth registration validation
const validateUserRegistration = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'moderator', 'admin'])
    .withMessage('Invalid role'),
  handleValidationErrors,
];

// Auth login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Current password required'),
  body('newPassword')
    .isString()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  handleValidationErrors,
];

// Ticket creation validation - simplified
const validateTicketCreate = (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters long',
      });
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length < 10
    ) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long',
      });
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
    });
  }
};

// Bulk operations validation
const validateTicketBulk = (req, res, next) => {
  try {
    const { action, ticketIds, data } = req.body;

    if (!action || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action and ticketIds array are required',
      });
    }

    // Validate ticket IDs
    const validIds = ticketIds.every((id) => /^[0-9a-fA-F]{24}$/.test(id));
    if (!validIds) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID format in array',
      });
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Bulk validation error',
    });
  }
};

module.exports = {
  validatePagination,
  validateTicketIdParam,
  sanitizeInput,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validateTicketCreate,
  validateTicketBulk,
  handleValidationErrors,
};
