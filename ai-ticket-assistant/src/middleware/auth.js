const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    console.log('🔐 Auth attempt:', {
      hasHeader: !!authHeader,
      url: req.url,
      method: req.method,
    });

    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        shouldLogout: true,
      });
    }

    // Extract token (handle both formats)
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }

    console.log(
      '🔑 Token extracted:',
      token ? `${token.substring(0, 20)}...` : 'None'
    );

    // Check if token exists and is not malformed strings
    if (
      !token ||
      token === 'undefined' ||
      token === 'null' ||
      token.trim() === ''
    ) {
      console.log('❌ Invalid token format');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
        shouldLogout: true,
      });
    }

    // Verify token with better error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified:', {
        userId: decoded.userId,
        exp: new Date(decoded.exp * 1000),
      });
    } catch (jwtError) {
      console.log('❌ JWT Error:', jwtError.message);

      let errorMessage = 'Invalid token.';
      let shouldLogout = true;

      if (jwtError.name === 'JsonWebTokenError') {
        if (jwtError.message === 'jwt malformed') {
          errorMessage = 'Token is malformed. Please login again.';
        } else if (jwtError.message === 'invalid signature') {
          errorMessage = 'Token signature is invalid.';
        } else {
          errorMessage = 'Token is invalid.';
        }
      } else if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired. Please login again.';
      } else if (jwtError.name === 'NotBeforeError') {
        errorMessage = 'Token not active yet.';
      }

      return res.status(401).json({
        success: false,
        message: errorMessage,
        shouldLogout,
      });
    }

    // Check if decoded token has required fields
    if (!decoded.userId) {
      console.log('❌ Token missing userId');
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure.',
        shouldLogout: true,
      });
    }

    // Find user and check if still exists and is active
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
        shouldLogout: true,
      });
    }

    if (!user.isActive) {
      console.log('❌ User inactive:', user.email);
      return res.status(401).json({
        success: false,
        message: 'User account has been deactivated.',
        shouldLogout: true,
      });
    }

    if (user.isLocked) {
      console.log('❌ User locked:', user.email);
      return res.status(423).json({
        success: false,
        message:
          'Account is temporarily locked due to multiple failed login attempts.',
        shouldLogout: false, // Don't logout, just locked temporarily
      });
    }

    console.log('✅ User authenticated:', {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Add user to request object (consistent field names)
    req.user = {
      _id: user._id,
      id: user._id, // For compatibility
      userId: user._id, // For compatibility
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    logger.error('Authentication error:', error);

    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      shouldLogout: false,
    });
  }
};

/**
 * Role-based Authorization Middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt by user ${req.user._id} with role ${
          req.user.role
        } for roles: ${roles.join(', ')}`
      );
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has elevated permissions
 */
const checkResourceOwnership = (resourceField = 'createdBy') => {
  return (req, res, next) => {
    // Admins can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // For other roles, check ownership or assignment
    req.checkOwnership = (resource) => {
      const userId = req.user._id.toString();
      const ownerId = resource[resourceField]?.toString();
      const assignedId = resource.assignedTo?.toString();

      return (
        userId === ownerId || userId === assignedId || req.user.role === 'admin'
      );
    };

    next();
  };
};

/**
 * Optional authentication middleware
 * Sets user if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token === 'undefined' || token === 'null') {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive && !user.isLocked) {
      req.user = {
        _id: user._id,
        id: user._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        isActive: user.isActive,
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    console.log('⚠️ Optional auth failed (this is okay):', error.message);
    next();
  }
};

/**
 * Rate limiting middleware for sensitive operations
 */
const sensitiveOperationLimit = (
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user._id : '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(key)) {
      const userAttempts = attempts
        .get(key)
        .filter((time) => time > windowStart);
      attempts.set(key, userAttempts);
    }

    const currentAttempts = attempts.get(key) || [];

    if (currentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...currentAttempts);
      const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000);

      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.max(retryAfter, 1), // At least 1 second
      });
    }

    // Record this attempt
    currentAttempts.push(now);
    attempts.set(key, currentAttempts);

    next();
  };
};

/**
 * Skill-based access control
 * Checks if user has required skills for ticket assignment
 */
const checkSkillMatch = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  req.hasRequiredSkills = (requiredSkills) => {
    if (!requiredSkills || requiredSkills.length === 0) {
      return true;
    }

    const userSkills = req.user.skills || [];
    return requiredSkills.some((skill) =>
      userSkills.some(
        (userSkill) =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
  };

  next();
};

module.exports = {
  authenticate,
  authorize,
  checkResourceOwnership,
  optionalAuth,
  sensitiveOperationLimit,
  checkSkillMatch,
};
