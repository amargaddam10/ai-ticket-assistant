const express = require('express');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateUserUpdate,
  validatePagination,
  sanitizeInput,
} = require('../middleware/validation');
const {
  asyncHandler,
  sendErrorResponse,
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/users/moderators
 * @desc    Get all moderators (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/moderators',
  authenticate,
  authorize('admin'),
  validatePagination,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      skills,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { role: 'moderator' };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      const skillRegex = skillsArray.map((skill) => new RegExp(skill, 'i'));
      query.skills = { $in: skillRegex };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [moderators, total] = await Promise.all([
      User.find(query, User.getPublicFields())
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    // Get ticket counts for each moderator
    const moderatorsWithStats = await Promise.all(
      moderators.map(async (moderator) => {
        const [assignedTickets, completedTickets] = await Promise.all([
          Ticket.countDocuments({
            assignedTo: moderator._id,
            status: { $in: ['open', 'in-progress'] },
          }),
          Ticket.countDocuments({
            assignedTo: moderator._id,
            status: { $in: ['resolved', 'closed'] },
          }),
        ]);

        return {
          ...moderator,
          stats: {
            assignedTickets,
            completedTickets,
            totalHandled: assignedTickets + completedTickets,
          },
        };
      })
    );

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        moderators: moderatorsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalModerators: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only, or self)
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Users can only access their own profile, admins can access any
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    const user = await User.findById(id, User.getPublicFields());

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Get user statistics if requested by admin
    let userStats = null;
    if (req.user.role === 'admin') {
      const [createdTickets, assignedTickets, completedTickets] =
        await Promise.all([
          Ticket.countDocuments({ createdBy: id }),
          Ticket.countDocuments({
            assignedTo: id,
            status: { $in: ['open', 'in-progress'] },
          }),
          Ticket.countDocuments({
            assignedTo: id,
            status: { $in: ['resolved', 'closed'] },
          }),
        ]);

      userStats = {
        ticketsCreated: createdTickets,
        ticketsAssigned: assignedTickets,
        ticketsCompleted: completedTickets,
      };
    }

    res.json({
      success: true,
      data: {
        user,
        stats: userStats,
      },
    });
  })
);

/**
 * @route   PUT /api/users/:id/skills
 * @desc    Update user skills (Admin only, or self for moderators)
 * @access  Private
 */
router.put(
  '/:id/skills',
  authenticate,
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { skills } = req.body;

    // Validate skills array
    if (!Array.isArray(skills)) {
      return sendErrorResponse(res, 400, 'Skills must be an array');
    }

    // Check permissions
    const canUpdate =
      req.user.role === 'admin' ||
      (req.user._id.toString() === id && req.user.role === 'moderator');

    if (!canUpdate) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    const user = await User.findById(id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Validate and filter skills
    const validSkills = skills.filter(
      (skill) =>
        skill &&
        typeof skill === 'string' &&
        skill.trim().length >= 2 &&
        skill.trim().length <= 30
    );

    if (validSkills.length !== skills.length) {
      return sendErrorResponse(
        res,
        400,
        'All skills must be strings between 2 and 30 characters'
      );
    }

    // Update skills
    user.skills = [...new Set(validSkills.map((s) => s.toLowerCase().trim()))];
    await user.save();

    logger.info(`Skills updated for user: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          skills: user.skills,
          updatedAt: user.updatedAt,
        },
      },
    });
  })
);

/**
 * @route   GET /api/users/skills/available
 * @desc    Get all available skills from moderators (Admin, Moderator only)
 * @access  Private (Admin, Moderator)
 */
router.get(
  '/skills/available',
  authenticate,
  authorize('moderator', 'admin'),
  asyncHandler(async (req, res) => {
    const skillsAggregation = await User.aggregate([
      { $match: { role: 'moderator', isActive: true } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 },
          moderators: {
            $addToSet: { name: '$name', email: '$email', _id: '$_id' },
          },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]);

    const skills = skillsAggregation.map((item) => ({
      skill: item._id,
      count: item.count,
      moderators: item.moderators,
    }));

    res.json({
      success: true,
      data: {
        skills,
        totalSkills: skills.length,
      },
    });
  })
);

/**
 * @route   GET /api/users/search-moderators
 * @desc    Search moderators by skills for ticket assignment
 * @access  Private (Moderator, Admin)
 */
router.get(
  '/search-moderators',
  authenticate,
  authorize('moderator', 'admin'),
  asyncHandler(async (req, res) => {
    const { skills, excludeAssigned } = req.query;

    if (!skills) {
      return sendErrorResponse(res, 400, 'Skills parameter is required');
    }

    const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
    const moderators = await User.findModeratorsBySkills(
      skillsArray.map((s) => s.trim())
    );

    // If requested, exclude moderators who are already assigned to tickets
    let availableModerators = moderators;
    if (excludeAssigned === 'true') {
      const assignedModeratorIds = await Ticket.distinct('assignedTo', {
        status: { $in: ['open', 'in-progress'] },
        assignedTo: { $ne: null },
      });

      availableModerators = moderators.filter(
        (mod) =>
          !assignedModeratorIds.some(
            (id) => id.toString() === mod._id.toString()
          )
      );
    }

    // Calculate match score based on skills overlap
    const moderatorsWithScore = availableModerators.map((moderator) => {
      const matchingSkills = moderator.skills.filter((skill) =>
        skillsArray.some(
          (reqSkill) =>
            skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
            reqSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );

      return {
        _id: moderator._id,
        name: moderator.name,
        email: moderator.email,
        skills: moderator.skills,
        matchingSkills,
        matchScore: matchingSkills.length,
        lastLogin: moderator.lastLogin,
      };
    });

    // Sort by match score (highest first), then by last login (most recent first)
    moderatorsWithScore.sort((a, b) => {
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const aLogin = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
      const bLogin = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
      return bLogin - aLogin;
    });

    res.json({
      success: true,
      data: {
        moderators: moderatorsWithScore,
        searchCriteria: {
          skills: skillsArray,
          excludeAssigned: excludeAssigned === 'true',
        },
      },
    });
  })
);

/**
 * @route   GET /api/users/workload-report
 * @desc    Get moderator workload report (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/workload-report',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { period = '30' } = req.query; // days
    const startDate = new Date(
      Date.now() - parseInt(period) * 24 * 60 * 60 * 1000
    );

    const workloadReport = await User.aggregate([
      { $match: { role: 'moderator', isActive: true } },
      {
        $lookup: {
          from: 'tickets',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$userId'] },
                createdAt: { $gte: startDate },
              },
            },
          ],
          as: 'assignedTickets',
        },
      },
      {
        $lookup: {
          from: 'tickets',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$userId'] },
                status: { $in: ['resolved', 'closed'] },
                resolvedAt: { $gte: startDate },
              },
            },
          ],
          as: 'completedTickets',
        },
      },
      {
        $addFields: {
          currentLoad: {
            $size: {
              $filter: {
                input: '$assignedTickets',
                as: 'ticket',
                cond: { $in: ['$$ticket.status', ['open', 'in-progress']] },
              },
            },
          },
          completedCount: { $size: '$completedTickets' },
          totalAssigned: { $size: '$assignedTickets' },
          avgResolutionTime: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$completedTickets',
                    as: 'ticket',
                    cond: { $ne: ['$$ticket.actualResolutionTime', null] },
                  },
                },
                as: 'ticket',
                in: '$$ticket.actualResolutionTime',
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          skills: 1,
          currentLoad: 1,
          completedCount: 1,
          totalAssigned: 1,
          avgResolutionTime: { $round: ['$avgResolutionTime', 2] },
          lastLogin: 1,
          efficiency: {
            $cond: [
              { $gt: ['$totalAssigned', 0] },
              {
                $round: [{ $divide: ['$completedCount', '$totalAssigned'] }, 2],
              },
              0,
            ],
          },
        },
      },
      { $sort: { currentLoad: -1, efficiency: -1 } },
    ]);

    // Calculate summary statistics
    const summary = {
      totalModerators: workloadReport.length,
      avgCurrentLoad: Math.round(
        workloadReport.reduce((sum, mod) => sum + mod.currentLoad, 0) /
          workloadReport.length
      ),
      avgEfficiency:
        Math.round(
          (workloadReport.reduce((sum, mod) => sum + mod.efficiency, 0) /
            workloadReport.length) *
            100
        ) / 100,
      avgResolutionTime:
        Math.round(
          workloadReport
            .filter((mod) => mod.avgResolutionTime > 0)
            .reduce(
              (sum, mod, _, arr) => sum + mod.avgResolutionTime / arr.length,
              0
            ) * 100
        ) / 100,
      period: `${period} days`,
    };

    res.json({
      success: true,
      data: {
        moderators: workloadReport,
        summary,
      },
    });
  })
);

/**
 * @route   POST /api/users/:id/activate
 * @desc    Activate/Deactivate user (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/:id/activate',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendErrorResponse(res, 400, 'isActive must be a boolean value');
    }

    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString() && isActive === false) {
      return sendErrorResponse(res, 400, 'Cannot deactivate your own account');
    }

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const action = isActive ? 'activated' : 'deactivated';
    logger.info(`User ${action}: ${user.email} by admin ${req.user.email}`);

    res.json({
      success: true,
      message: `User ${action} successfully`,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
      },
    });
  })
);

/**
 * @route   POST /api/users/promote-to-moderator
 * @desc    Promote user to moderator (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/promote-to-moderator',
  authenticate,
  authorize('admin'),
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { userId, initialSkills = [] } = req.body;

    if (!userId) {
      return sendErrorResponse(res, 400, 'userId is required');
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    if (user.role !== 'user') {
      return sendErrorResponse(
        res,
        400,
        'Can only promote users to moderator role'
      );
    }

    // Update user role and skills
    user.role = 'moderator';
    if (initialSkills.length > 0) {
      const validSkills = initialSkills.filter(
        (skill) =>
          skill &&
          typeof skill === 'string' &&
          skill.trim().length >= 2 &&
          skill.trim().length <= 30
      );
      user.skills = [
        ...new Set(validSkills.map((s) => s.toLowerCase().trim())),
      ];
    }

    await user.save();

    logger.info(
      `User promoted to moderator: ${user.email} by admin ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'User promoted to moderator successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          skills: user.skills,
          updatedAt: user.updatedAt,
        },
      },
    });
  })
);

/**
 * @route   GET /api/users/admin/all-users
 * @desc    Get all users for admin panel (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/admin/all-users',
  authenticate,
  authorize('admin'),
  validatePagination,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query, User.getPublicFields())
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    // Get ticket counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [createdTickets, assignedTickets, completedTickets] =
          await Promise.all([
            Ticket.countDocuments({ createdBy: user._id }),
            Ticket.countDocuments({
              assignedTo: user._id,
              status: { $in: ['open', 'in-progress'] },
            }),
            Ticket.countDocuments({
              assignedTo: user._id,
              status: { $in: ['resolved', 'closed'] },
            }),
          ]);

        return {
          ...user,
          stats: {
            createdTickets,
            assignedTickets,
            completedTickets,
            totalHandled: assignedTickets + completedTickets,
          },
        };
      })
    );

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  })
);

/**
 * @route   PUT /api/users/admin/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/admin/:id/role',
  authenticate,
  authorize('admin'),
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      return sendErrorResponse(res, 400, 'Valid role is required');
    }

    // Prevent admin from changing their own role
    if (id === req.user._id.toString()) {
      return sendErrorResponse(res, 400, 'Cannot change your own role');
    }

    const user = await User.findById(id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.info(
      `User role updated: ${user.email} from ${oldRole} to ${role} by admin ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          skills: user.skills,
          updatedAt: user.updatedAt,
        },
      },
    });
  })
);

/**
 * @route   PUT /api/users/admin/:id/skills
 * @desc    Update user skills (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/admin/:id/skills',
  authenticate,
  authorize('admin'),
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { skills } = req.body;

    // Validate skills array
    if (!Array.isArray(skills)) {
      return sendErrorResponse(res, 400, 'Skills must be an array');
    }

    const user = await User.findById(id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Validate and filter skills
    const validSkills = skills.filter(
      (skill) =>
        skill &&
        typeof skill === 'string' &&
        skill.trim().length >= 2 &&
        skill.trim().length <= 30
    );

    if (validSkills.length !== skills.length) {
      return sendErrorResponse(
        res,
        400,
        'All skills must be strings between 2 and 30 characters'
      );
    }

    // Update skills
    user.skills = [...new Set(validSkills.map((s) => s.toLowerCase().trim()))];
    await user.save();

    logger.info(
      `Skills updated for user: ${user.email} by admin ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'User skills updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          skills: user.skills,
          updatedAt: user.updatedAt,
        },
      },
    });
  })
);

module.exports = router;
