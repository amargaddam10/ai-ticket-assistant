// const express = require('express');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const User = require('../models/User');
// const crypto = require('crypto');
// const { sendPasswordResetEmail } = require('../services/emailService');
// const { authenticate, authorize } = require('../middleware/auth');
// const {
//   validateUserRegistration,
//   validateUserLogin,
//   validatePasswordChange,
//   sanitizeInput,
// } = require('../middleware/validation');
// const {
//   asyncHandler,
//   sendErrorResponse,
// } = require('../middleware/errorHandler');
// const logger = require('../utils/logger');

// const router = express.Router();

// // Generate JWT token
// const generateToken = (userId) => {
//   return jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || '7d',
//     issuer: 'ai-ticket-system',
//     audience: 'ai-ticket-users',
//   });
// };

// /**
//  * @route   POST /api/auth/register
//  * @desc    Register a new user
//  * @access  Public
//  */
// router.post(
//   '/register',
//   sanitizeInput,
//   validateUserRegistration,
//   asyncHandler(async (req, res) => {
//     try {
//       const { name, email, password, role = 'user' } = req.body;

//       console.log('🔐 Registration attempt:', { name, email, role });

//       // Check if user already exists
//       const existingUser = await User.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           message: 'User with this email already exists',
//         });
//       }

//       // Only admins can create admin users
//       if (role === 'admin') {
//         return res.status(403).json({
//           success: false,
//           message: 'Cannot create admin users through registration',
//         });
//       }

//       // Create user
//       const user = new User({
//         name,
//         email,
//         password,
//         role,
//       });

//       await user.save();

//       // Generate token
//       const token = generateToken(user._id);

//       logger.info(`New user registered: ${email} with role: ${role}`);

//       res.status(201).json({
//         success: true,
//         message: 'User registered successfully',
//         data: {
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             skills: user.skills,
//             createdAt: user.createdAt,
//             profilePhoto: user.profilePhoto, // ✅ ADD THIS LINE
//           },
//         },
//         token,
//       });
//     } catch (error) {
//       console.error('❌ Registration error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Registration failed',
//         error: error.message,
//       });
//     }
//   })
// );

// /**
//  * @route   POST /api/auth/login
//  * @desc    Login user
//  * @access  Public
//  */
// router.post(
//   '/login',
//   sanitizeInput,
//   validateUserLogin,
//   asyncHandler(async (req, res) => {
//     try {
//       const { email, password } = req.body;

//       console.log('🔑 Login attempt:', { email });

//       // Find user with password field
//       const user = await User.findOne({ email }).select('+password');
//       if (!user) {
//         console.log('❌ User not found:', email);
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid email or password',
//         });
//       }

//       console.log('✅ User found:', {
//         id: user._id,
//         email: user.email,
//         role: user.role,
//         isActive: user.isActive,
//       });

//       // Check if account is locked
//       if (user.isLocked) {
//         console.log('🔒 Account locked:', email);
//         return res.status(423).json({
//           success: false,
//           message:
//             'Account is temporarily locked due to multiple failed login attempts',
//         });
//       }

//       // Check if account is active
//       if (!user.isActive) {
//         console.log('⚠️ Account inactive:', email);
//         return res.status(401).json({
//           success: false,
//           message: 'Account has been deactivated',
//         });
//       }
//       // 🔍 LOGIN DEBUG: Add this detailed debug
//       console.log('🔍 Login Debug:', {
//         userFound: user ? 'YES' : 'NO',
//         email: user?.email,
//         userPasswordLength: user?.password ? user.password.length : 0,
//         userPasswordFirst10: user?.password
//           ? user.password.substring(0, 10) + '...'
//           : 'MISSING',
//         inputPassword: password,
//         inputPasswordLength: password.length,
//         passwordChangedAt: user?.passwordChangedAt,
//       });
//       // Validate password
//       console.log('🔍 Comparing passwords...');
//       const isPasswordValid = await user.comparePassword(password);
//       console.log('Password valid:', isPasswordValid);

//       if (!isPasswordValid) {
//         console.log('❌ Invalid password for:', email);
//         logger.warn(`Failed login attempt for user: ${email}`);

//         // Increment failed login attempts
//         if (user.incLoginAttempts) {
//           await user.incLoginAttempts();
//         }

//         return res.status(401).json({
//           success: false,
//           message: 'Invalid email or password',
//         });
//       }

//       // Reset failed login attempts and update last login
//       if (user.resetLoginAttempts) {
//         await user.resetLoginAttempts();
//       }

//       // Generate token
//       const token = generateToken(user._id);

//       logger.info(`User logged in successfully: ${email}`);

//       res.json({
//         success: true,
//         message: 'Login successful',
//         data: {
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             skills: user.skills,
//             lastLogin: user.lastLogin,
//             profilePhoto: user.profilePhoto, // ✅ ADD THIS LINE
//           },
//         },
//         token,
//       });
//     } catch (error) {
//       console.error('❌ Login error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Login failed',
//         error: error.message,
//       });
//     }
//   })
// );

// /**
//  * @route   POST /api/auth/forgot-password
//  * @desc    Send password reset email
//  * @access  Public
//  */
// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email is required',
//       });
//     }

//     // Check if user exists
//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) {
//       // Don't reveal if user exists or not for security
//       return res.status(200).json({
//         success: true,
//         message:
//           'If an account with that email exists, a password reset link has been sent.',
//       });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     const resetTokenHash = crypto
//       .createHash('sha256')
//       .update(resetToken)
//       .digest('hex');

//     // Set reset token and expiration (1 hour)
//     user.passwordResetToken = resetTokenHash;
//     user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     await user.save();

//     try {
//       // Send reset email
//       await sendPasswordResetEmail(user.email, resetToken, user.name);

//       logger.info(`Password reset email sent to ${user.email}`);

//       res.status(200).json({
//         success: true,
//         message: 'Password reset email sent successfully',
//       });
//     } catch (emailError) {
//       // Reset the token fields if email fails
//       user.passwordResetToken = undefined;
//       user.passwordResetExpires = undefined;
//       await user.save();

//       logger.error('Failed to send password reset email:', emailError);

//       res.status(500).json({
//         success: false,
//         message: 'Failed to send password reset email. Please try again later.',
//       });
//     }
//   } catch (error) {
//     logger.error('Forgot password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again later.',
//     });
//   }
// });

// /**
//  * @route   POST /api/auth/reset-password
//  * @desc    Reset user password with token
//  * @access  Public
//  */
// router.post('/reset-password', async (req, res) => {
//   try {
//     const { token, password, confirmPassword } = req.body;

//     // Validation
//     if (!token || !password || !confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required',
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Passwords do not match',
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password must be at least 6 characters long',
//       });
//     }

//     // Hash the token to compare with stored hash
//     const resetTokenHash = crypto
//       .createHash('sha256')
//       .update(token)
//       .digest('hex');

//     // Find user with valid reset token
//     const user = await User.findOne({
//       passwordResetToken: resetTokenHash,
//       passwordResetExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired reset token',
//       });
//     }

//     // 🔧 DEBUG: Add this debug code
//     console.log('🔧 Pre-save Debug:', {
//       originalPasswordLength: user.password ? user.password.length : 0,
//       newPlaintextPassword: password,
//       newPasswordLength: password.length,
//     });

//     // Let the User model handle password hashing automatically
//     user.password = password; // ← Set PLAIN password, let model hash it
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     user.passwordChangedAt = new Date();

//     await user.save();

//     console.log('✅ Post-save Debug - Password updated via User model');

//     logger.info(`Password successfully reset for user ${user.email}`);

//     res.status(200).json({
//       success: true,
//       message: 'Password reset successfully',
//     });
//   } catch (error) {
//     logger.error('Reset password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error. Please try again later.',
//     });
//   }
// });

// /**
//  * @route   GET /api/auth/me
//  * @desc    Get current user profile
//  * @access  Private
//  */
// router.get(
//   '/me',
//   authenticate,
//   asyncHandler(async (req, res) => {
//     try {
//       const user = await User.findById(req.user.userId || req.user.id);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found',
//         });
//       }
//       console.log('📸 User profile photo from DB:', user.profilePhoto); // ADD DEBUG LOG

//       res.json({
//         success: true,
//         data: {
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             skills: user.skills,
//             isActive: user.isActive,
//             createdAt: user.createdAt,
//             updatedAt: user.updatedAt,
//             lastLogin: user.lastLogin,
//             profilePhoto: user.profilePhoto, // ✅ ADD THIS LINE
//           },
//         },
//       });
//     } catch (error) {
//       console.error('❌ Get profile error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get profile',
//         error: error.message,
//       });
//     }
//   })
// );

// /**
//  * @route   POST /api/auth/logout
//  * @desc    Logout user (client-side token invalidation)
//  * @access  Private
//  */
// router.post(
//   '/logout',
//   authenticate,
//   asyncHandler(async (req, res) => {
//     // In a JWT implementation, logout is typically handled client-side by removing the token.
//     // For enhanced security, we could maintain a blacklist of tokens, but that's beyond basic implementation.

//     logger.info(`User logged out: ${req.user.email}`);

//     res.json({
//       success: true,
//       message: 'Logged out successfully',
//     });
//   })
// );

// /**
//  * @route   PUT /api/auth/profile
//  * @desc    Update current user profile
//  * @access  Private
//  */
// router.put(
//   '/profile',
//   authenticate,
//   sanitizeInput,
//   asyncHandler(async (req, res) => {
//     try {
//       const { name, skills } = req.body;
//       const updates = {};

//       if (name !== undefined) {
//         if (!name || name.trim().length < 2 || name.trim().length > 50) {
//           return res.status(400).json({
//             success: false,
//             message: 'Name must be between 2 and 50 characters',
//           });
//         }
//         if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
//           return res.status(400).json({
//             success: false,
//             message: 'Name can only contain letters and spaces',
//           });
//         }
//         updates.name = name.trim();
//       }

//       if (skills !== undefined) {
//         if (!Array.isArray(skills)) {
//           return res.status(400).json({
//             success: false,
//             message: 'Skills must be an array',
//           });
//         }

//         const validSkills = skills.filter(
//           (skill) =>
//             skill &&
//             typeof skill === 'string' &&
//             skill.trim().length >= 2 &&
//             skill.trim().length <= 30
//         );
//         updates.skills = [
//           ...new Set(validSkills.map((s) => s.toLowerCase().trim())),
//         ];
//       }

//       if (Object.keys(updates).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'No valid fields to update',
//         });
//       }

//       const user = await User.findByIdAndUpdate(
//         req.user.userId || req.user.id,
//         updates,
//         { new: true, runValidators: true }
//       );

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found',
//         });
//       }

//       logger.info(`User profile updated: ${user.email}`);

//       res.json({
//         success: true,
//         message: 'Profile updated successfully',
//         data: {
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             skills: user.skills,
//             updatedAt: user.updatedAt,
//             profilePhoto: user.profilePhoto, // ✅ ADD THIS LINE
//           },
//         },
//       });
//     } catch (error) {
//       console.error('❌ Profile update error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to update profile',
//         error: error.message,
//       });
//     }
//   })
// );

// /**
//  * @route   PUT /api/auth/change-password
//  * @desc    Change user password
//  * @access  Private
//  */
// router.put(
//   '/change-password',
//   authenticate,
//   sanitizeInput,
//   validatePasswordChange,
//   asyncHandler(async (req, res) => {
//     try {
//       const { currentPassword, newPassword } = req.body;

//       // Get user with password
//       const user = await User.findById(req.user.userId || req.user.id).select(
//         '+password'
//       );
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found',
//         });
//       }

//       // Verify current password
//       const isCurrentPasswordValid = await user.comparePassword(
//         currentPassword
//       );
//       if (!isCurrentPasswordValid) {
//         logger.warn(`Failed password change attempt for user: ${user.email}`);
//         return res.status(401).json({
//           success: false,
//           message: 'Current password is incorrect',
//         });
//       }

//       // Check if new password is different from current
//       const isSamePassword = await user.comparePassword(newPassword);
//       if (isSamePassword) {
//         return res.status(400).json({
//           success: false,
//           message: 'New password must be different from current password',
//         });
//       }

//       // Update password
//       user.password = newPassword;
//       await user.save();

//       logger.info(`Password changed successfully for user: ${user.email}`);

//       res.json({
//         success: true,
//         message: 'Password changed successfully',
//       });
//     } catch (error) {
//       console.error('❌ Password change error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to change password',
//         error: error.message,
//       });
//     }
//   })
// );

// module.exports = router;

const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// Basic login route (without dependencies)
router.post('/login', (req, res) => {
  res.json({
    success: false,
    message: 'Basic login endpoint working - full auth coming soon',
    received: {
      email: req.body?.email || 'not provided',
      hasPassword: !!req.body?.password,
    },
  });
});

module.exports = router;
