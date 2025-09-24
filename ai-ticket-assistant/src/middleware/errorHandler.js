const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error('Error caught by global handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user._id : 'anonymous',
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = {
      name: 'CastError',
      message,
      statusCode: 404,
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue)[0];
    const message = `${
      duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)
    } already exists`;
    error = {
      name: 'DuplicateFieldError',
      message,
      statusCode: 400,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = {
      name: 'ValidationError',
      message: messages.join(', '),
      statusCode: 400,
      errors: messages,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      name: 'JsonWebTokenError',
      message: 'Invalid token',
      statusCode: 401,
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      name: 'TokenExpiredError',
      message: 'Token expired',
      statusCode: 401,
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      name: 'FileSizeError',
      message: 'File too large',
      statusCode: 400,
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      name: 'FileCountError',
      message: 'Too many files',
      statusCode: 400,
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      name: 'UnexpectedFileError',
      message: 'Unexpected file field',
      statusCode: 400,
    };
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = {
      name: 'DatabaseError',
      message: 'Database connection error. Please try again later.',
      statusCode: 503,
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      name: 'RateLimitError',
      message: 'Too many requests. Please try again later.',
      statusCode: 429,
    };
  }

  // Inngest errors
  if (err.name === 'InngestError') {
    error = {
      name: 'InngestError',
      message: 'Background processing error. Please try again later.',
      statusCode: 500,
    };
  }

  // AI/Gemini API errors
  if (err.message && err.message.includes('API key')) {
    error = {
      name: 'AIServiceError',
      message: 'AI service configuration error',
      statusCode: 500,
    };
  }

  if (err.message && err.message.includes('quota')) {
    error = {
      name: 'AIQuotaError',
      message: 'AI service quota exceeded. Please try again later.',
      statusCode: 503,
    };
  }

  // Email service errors
  if (err.code && err.code.includes('SMTP')) {
    error = {
      name: 'EmailServiceError',
      message: 'Email service error. Notification may not be sent.',
      statusCode: 500,
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prepare response object
  const response = {
    success: false,
    message: message,
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: error.name || err.name,
      stack: err.stack,
      details: error.errors || undefined,
    };
  }

  // Include specific error types in production for client handling
  if (process.env.NODE_ENV === 'production') {
    const allowedErrorTypes = [
      'ValidationError',
      'DuplicateFieldError',
      'CastError',
      'JsonWebTokenError',
      'TokenExpiredError',
      'RateLimitError',
    ];

    if (allowedErrorTypes.includes(error.name || err.name)) {
      response.errorType = error.name || err.name;
    }

    // Include validation errors in production
    if (error.errors) {
      response.errors = error.errors;
    }
  }

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Database error handler
 */
const handleDatabaseError = (error, operation = 'database operation') => {
  logger.error(`Database error during ${operation}:`, error);

  if (error.name === 'MongoNetworkError') {
    const dbError = new Error('Database connection failed');
    dbError.statusCode = 503;
    dbError.name = 'DatabaseError';
    throw dbError;
  }

  if (error.name === 'MongoTimeoutError') {
    const dbError = new Error('Database operation timed out');
    dbError.statusCode = 503;
    dbError.name = 'DatabaseError';
    throw dbError;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const dbError = new Error(`${field} already exists`);
    dbError.statusCode = 400;
    dbError.name = 'DuplicateFieldError';
    throw dbError;
  }

  // Re-throw the original error if not handled
  throw error;
};

/**
 * API response helper
 */
const sendErrorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.timestamp = new Date().toISOString();
  }

  res.status(statusCode).json(response);
};

/**
 * Validation error formatter
 */
const formatValidationErrors = (errors) => {
  return errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value,
  }));
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleDatabaseError,
  sendErrorResponse,
  formatValidationErrors,
};
