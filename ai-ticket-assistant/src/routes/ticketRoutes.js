const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const axios = require('axios'); // ✅ ADD THIS LINE

const {
  authenticate,
  authorize,
  checkSkillMatch,
} = require('../middleware/auth');
const {
  sanitizeInput,
  validatePagination,
  validateTicketCreate,
  validateTicketBulk,
  validateTicketIdParam,
} = require('../middleware/validation');
const {
  asyncHandler,
  sendErrorResponse,
} = require('../middleware/errorHandler');
const { inngest } = require('../lib/inngest');
const logger = require('../utils/logger');

const router = express.Router();

// ================================
// HEALTH CHECK - No auth required
// ================================
router.get('/health', (req, res) => {
  console.log('🏥 Health check route called');
  res.json({
    status: 'OK',
    message: 'Ticket routes loaded successfully',
    timestamp: new Date().toISOString(),
  });
});
// ADD THESE DEBUG ROUTES HERE:
// ================================
// DEBUG ROUTE - Test if basic routing works
// ================================
router.get('/debug', authenticate, (req, res) => {
  console.log('🧪 Debug route accessed');
  console.log('👤 User:', req.user.email, 'Role:', req.user.role);
  res.json({
    success: true,
    message: 'Tickets route is working!',
    user: {
      email: req.user.email,
      role: req.user.role,
      id: req.user._id || req.user.userId,
    },
    timestamp: new Date().toISOString(),
  });
});

// ================================
// SIMPLE TEST ROUTE - Without complex middleware
// ================================
router.get(
  '/test',
  authenticate,
  asyncHandler(async (req, res) => {
    console.log('🧪 Simple test route');

    const userId = req.user.userId || req.user._id;

    // Very basic query
    let query = {};
    if (req.user.role === 'user') {
      query.user = userId;
    }

    const count = await Ticket.countDocuments(query);

    res.json({
      success: true,
      message: 'Simple ticket query works!',
      count: count,
      user: req.user.email,
    });
  })
);
// ================================
// GET /api/tickets - List tickets with filters/pagination/sort
// ================================
router.get(
  '/',
  authenticate,
  // validatePagination,
  asyncHandler(async (req, res) => {
    try {
      console.log('📋 Fetching tickets with query:', req.query);
      console.log('👤 User:', req.user.email, 'Role:', req.user.role);

      // Manual validation instead of middleware
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
      const sortBy = [
        'createdAt',
        'updatedAt',
        'title',
        'priority',
        'status',
      ].includes(req.query.sortBy)
        ? req.query.sortBy
        : 'createdAt';
      const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';

      console.log('📊 Validated pagination:', { page, limit, sortBy, sortDir });

      const {
        sort,
        status,
        priority,
        category,
        type,
        search,
        assignedTo,
        createdBy,
        tag,
      } = req.query;

      // FIXED: Role-based filtering with proper unassigned handling
      let query = {};
      const userId = req.user.userId || req.user._id;

      // Handle user role with special consideration for unassigned filter
      if (req.user.role === 'user') {
        if (assignedTo === 'unassigned') {
          // For unassigned: show only tickets user created that have no assignee
          query = {
            $and: [
              {
                $or: [{ user: userId }, { createdBy: userId }],
              },
              {
                assignedTo: { $in: [null, undefined] },
              },
            ],
          };
          console.log('🔍 Applied unassigned filter for user role');
        } else {
          // Normal filtering: tickets created by user OR assigned to user
          query.$or = [
            { user: userId },
            { createdBy: userId },
            { assignedTo: userId },
          ];
        }
      } else {
        // Admins and moderators can see all tickets
        if (assignedTo === 'unassigned') {
          query.assignedTo = { $in: [null, undefined] };
          console.log('🔍 Applied unassigned filter for admin role');
        }
      }

      // Apply additional filters
      if (status) {
        query.status = Array.isArray(status) ? { $in: status } : status;
      }
      if (priority) {
        query.priority = priority;
        console.log('🔍 Applied priority filter:', priority);
      }
      if (category) query.category = category;
      if (type) query.type = type;

      // Apply assignedTo filter for specific users (not unassigned)
      if (
        assignedTo &&
        assignedTo !== 'unassigned' &&
        assignedTo !== 'all' &&
        assignedTo !== 'undefined'
      ) {
        query.assignedTo = assignedTo;
        console.log('🔍 Applied specific assignedTo filter:', assignedTo);
      }

      // Only admins can filter by specific createdBy
      if (
        createdBy &&
        (req.user.role === 'admin' || req.user.role === 'moderator')
      ) {
        query.createdBy = createdBy;
      }

      if (tag) {
        query.tags = { $in: Array.isArray(tag) ? tag : [tag] };
      }

      // Search functionality - FIXED
      if (search && search.trim()) {
        console.log('🔍 Backend searching for:', search);

        // Store existing conditions
        const existingConditions = { ...query };

        // Clear query and rebuild with $and
        query = {
          $and: [
            existingConditions,
            {
              $or: [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } },
              ],
            },
          ],
        };

        console.log('✅ Search query applied:', search);
      }

      // Handle different sort formats
      let sortObj = {};
      if (sort) {
        // Handle sort like "-createdAt" or "createdAt"
        if (sort.startsWith('-')) {
          sortObj[sort.substring(1)] = -1;
        } else {
          sortObj[sort] = 1;
        }
      } else {
        // Default sort
        sortObj[sortBy] = sortDir === 'desc' ? -1 : 1;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      console.log('🔍 Final MongoDB Query:', JSON.stringify(query, null, 2));
      console.log(
        '📊 Sort:',
        sortObj,
        'Skip:',
        skip,
        'Limit:',
        parseInt(limit)
      );

      const [tickets, total] = await Promise.all([
        Ticket.find(query)
          .populate('user', 'name email') // User who created the ticket
          .populate('createdBy', 'name email') // Alternative field name
          .populate('assignedTo', 'name email') // User assigned to the ticket
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .lean()
          .maxTimeMS(10000), // 10 second timeout
        Ticket.countDocuments(query).maxTimeMS(10000),
      ]);

      console.log('✅ Found', tickets.length, 'tickets out of', total, 'total');

      // Debug: Show sample tickets for troubleshooting
      if (tickets.length > 0 && (assignedTo === 'unassigned' || priority)) {
        console.log('📋 Sample filtered tickets:');
        tickets.slice(0, 3).forEach((ticket) => {
          console.log(
            `  - ${ticket.title} | Priority: ${ticket.priority} | AssignedTo: ${
              ticket.assignedTo ? 'Assigned' : 'Unassigned'
            }`
          );
        });
      }

      res.json({
        success: true,
        tickets: tickets, // Frontend expects 'tickets' directly
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      console.error('❌ Ticket fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: error.message,
      });
    }
  })
);

// ================================
// GET /api/tickets/count - Get ticket count with filters
// ================================
router.get(
  '/count',
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const { status, priority, category, user, assignedTo } = req.query;
      const currentUserId = req.user.userId || req.user._id;

      // Build query based on filters
      let query = {};

      // Role-based access control
      if (req.user.role === 'user') {
        query.$or = [
          { user: currentUserId },
          { createdBy: currentUserId },
          { assignedTo: currentUserId },
        ];
      }

      // Apply filters
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (user && user !== 'undefined') query.user = user;
      // FIX FOR UNASSIGNED COUNT:
      if (assignedTo === 'unassigned') {
        query.assignedTo = { $in: [null, undefined] };
      } else if (
        assignedTo &&
        assignedTo !== 'all' &&
        assignedTo !== 'undefined'
      ) {
        query.assignedTo = assignedTo;
      }

      const count = await Ticket.countDocuments(query);

      console.log('📊 Count query:', query, 'Result:', count);

      res.json({ count });
    } catch (error) {
      console.error('❌ Count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to count tickets',
        error: error.message,
      });
    }
  })
);

// ================================
// GET /api/tickets/:id - Get single ticket
// ================================
router.get(
  '/:id',
  authenticate,
  validateTicketIdParam,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user.userId || req.user._id;

      // Build query with role-based filtering
      let query = { _id: req.params.id };

      // Users can only see tickets they created or are assigned to
      if (req.user.role === 'user') {
        query.$or = [
          { user: userId },
          { createdBy: userId },
          { assignedTo: userId },
        ];
      }

      const ticket = await Ticket.findOne(query)
        .populate('user', 'name email')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found or access denied',
        });
      }

      res.json({
        success: true,
        ticket: ticket, // Frontend expects 'ticket' directly
      });
    } catch (error) {
      console.error('❌ Single ticket fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket',
        error: error.message,
      });
    }
  })
);

// ================================
// POST /api/tickets - Create new ticket (FIXED - Uses centralized AI service)
// ================================
router.post(
  '/',
  authenticate,
  sanitizeInput,
  asyncHandler(async (req, res) => {
    try {
      console.log('🎫 Creating ticket with data:', req.body);
      console.log('👤 User creating:', req.user.email);

      const {
        title,
        description,
        priority,
        category,
        type,
        tags,
        requiredSkills = [],
      } = req.body;

      const userId = req.user.userId || req.user._id;

      // Validation
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required',
        });
      }

      if (title.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Title must be at least 3 characters long',
        });
      }

      if (description.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Description must be at least 10 characters long',
        });
      }

      // Set defaults for regular users, allow customization for admins/moderators
      const ticketData = {
        title: title.trim(),
        description: description.trim(),
        priority:
          req.user.role === 'admin' || req.user.role === 'moderator'
            ? priority || 'medium'
            : 'medium',
        type: type || 'general',
        tags: Array.isArray(tags) ? tags : [],
        requiredSkills: Array.isArray(requiredSkills)
          ? requiredSkills.map((s) => s.toLowerCase().trim())
          : [],
        user: userId,
        createdBy: userId,
        status: 'open',
      };

      console.log('💾 Saving ticket with data:', ticketData);

      const ticket = await Ticket.create(ticketData);

      // Populate user details
      await ticket.populate('user', 'name email');
      await ticket.populate('createdBy', 'name email');
      console.log('✅ Ticket created successfully:', ticket._id);

      logger.info(`Ticket created: ${ticket._id} by user: ${req.user.email}`);

      // USE CENTRALIZED AI SERVICE ONLY
      try {
        console.log('🤖 Using centralized AI service for ticket:', ticket._id);

        // Import the centralized AI service
        const { analyzeTicketWithAI } = require('../services/aiService');

        // Use centralized AI service (this has your correct format)
        const aiResult = await analyzeTicketWithAI({
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          type: ticket.type,
        });

        console.log(
          '✅ Centralized AI service completed for ticket:',
          ticket._id
        );

        // Update ticket with AI response from centralized service
        await Ticket.findByIdAndUpdate(ticket._id, {
          aiNotes: aiResult.aiResponse,
          aiResponse: aiResult.aiResponse,
          aiProcessed: true,
          aiProcessedAt: new Date(),
          status: 'resolved',
          resolvedAt: new Date(),
        });

        console.log('✅ Ticket updated with centralized AI response');
      } catch (aiError) {
        console.error('❌ Centralized AI processing failed:', aiError.message);
      }

      // Fire Inngest event for AI processing & auto-assignment (keep as backup)
      try {
        await inngest.send({
          name: 'ticket/created',
          data: {
            ticketId: ticket._id.toString(),
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            category: ticket.category,
            type: ticket.type,
            createdBy: userId.toString(),
          },
        });
        console.log('📤 Inngest event sent successfully');
      } catch (inngestError) {
        console.warn('⚠️ Inngest event failed:', inngestError);
      }

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        ticket: ticket,
      });
    } catch (error) {
      console.error('❌ Ticket creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ticket',
        error: error.message,
      });
    }
  })
);

// ================================
// POST /api/tickets/create - Alternative create endpoint (for compatibility)
// ================================
router.post(
  '/create',
  authenticate,
  sanitizeInput,
  asyncHandler(async (req, res) => {
    try {
      const {
        title,
        description,
        priority = 'medium',
        category = 'general',
        type = 'support',
        requiredSkills = [],
      } = req.body;

      const userId = req.user.userId || req.user._id;

      const ticket = await Ticket.create({
        title,
        description,
        priority,
        category,
        type,
        requiredSkills: (requiredSkills || []).map((s) =>
          s.toLowerCase().trim()
        ),
        user: userId,
        createdBy: userId,
        status: 'open',
        createdAt: new Date(),
      });

      // Populate user details
      await ticket.populate('user', 'name email');
      await ticket.populate('createdBy', 'name email');

      // IMMEDIATE AI PROCESSING - Add this
      try {
        console.log(
          '🤖 Triggering immediate AI processing for ticket (create endpoint):',
          ticket._id
        );

        // Generate fallback AI response immediately
        const fallbackAIResponse = generateFallbackAIResponse(
          ticket.title,
          ticket.description,
          ticket.priority
        );

        // Update ticket with AI response AND auto-resolve
        await Ticket.findByIdAndUpdate(ticket.id, {
          aiNotes: fallbackAIResponse,
          aiResponse: fallbackAIResponse, // Also set aiResponse for frontend compatibility
          aiProcessed: true,
          aiProcessedAt: new Date(),
          status: 'resolved', // ✅ ADD THIS LINE - Auto-resolve after AI response
          resolvedAt: new Date(), // ✅ ADD THIS LINE - Mark when it was resolved
        });

        console.log(
          '✅ Fallback AI response added to ticket (create endpoint):',
          ticket._id
        );
      } catch (aiSetupError) {
        console.warn(
          '⚠️ AI processing setup failed (create endpoint):',
          aiSetupError.message
        );
      }

      // Fire Inngest event for AI processing & auto-assignment
      try {
        await inngest.send({
          name: 'ticket/created',
          data: {
            ticketId: ticket._id.toString(),
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            category: ticket.category,
            type: ticket.type,
            createdBy: userId.toString(),
          },
        });
      } catch (inngestError) {
        console.warn('⚠️ Inngest event failed:', inngestError);
      }

      res.status(201).json({
        success: true,
        message: 'Ticket created',
        ticket: ticket,
      });
    } catch (error) {
      console.error('❌ Alternative ticket creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ticket',
        error: error.message,
      });
    }
  })
);

// ================================
// PUT /api/tickets/:id - Update ticket
// ================================
router.put(
  '/:id',
  authenticate,
  sanitizeInput,
  validateTicketIdParam,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user.userId || req.user._id;
      const ticketId = req.params.id;

      // Build query with role-based filtering
      let query = { _id: ticketId };

      // Users can only update tickets they created (unless they're admin/moderator)
      if (req.user.role === 'user') {
        query.$or = [{ user: userId }, { createdBy: userId }];
      }

      const ticket = await Ticket.findOne(query);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found or access denied',
        });
      }

      // Extract allowed updates based on role
      const updates = {};
      const {
        title,
        description,
        priority,
        category,
        status,
        tags,
        assignedTo,
      } = req.body;

      // All users can update title and description of their own tickets
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;

      // Only admins/moderators can update these fields
      if (req.user.role === 'admin' || req.user.role === 'moderator') {
        if (priority !== undefined) updates.priority = priority;
        if (category !== undefined) updates.category = category;
        if (status !== undefined) {
          updates.status = status;
          if (status === 'resolved' && ticket.status !== 'resolved') {
            updates.resolvedAt = new Date();
          }
        }
        if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
        if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      }

      updates.updatedAt = new Date();

      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { $set: updates },
        { new: true, runValidators: true }
      )
        .populate('user', 'name email')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');

      logger.info(`Ticket updated: ${ticketId} by user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        ticket: updatedTicket,
      });
    } catch (error) {
      console.error('❌ Ticket update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ticket',
        error: error.message,
      });
    }
  })
);

// ================================
// POST /api/tickets/bulk - Bulk operations
// ================================
router.post(
  '/bulk',
  authenticate,
  authorize('moderator', 'admin'),
  sanitizeInput,
  asyncHandler(async (req, res) => {
    try {
      const { action, ticketIds, data } = req.body;
      const userId = req.user.userId || req.user._id;

      if (!action || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Action and ticketIds array are required',
        });
      }

      // Security: Ensure users can only perform bulk operations on accessible tickets
      let ticketFilter = { _id: { $in: ticketIds } };

      // If user is not an admin, they can only modify tickets they have access to
      if (req.user.role !== 'admin') {
        ticketFilter.$or = [
          { user: userId },
          { createdBy: userId },
          { assignedTo: userId },
        ];
      }

      if (action === 'assign') {
        const { userId: assigneeId } = data || {};
        if (!assigneeId) {
          return res.status(400).json({
            success: false,
            message: 'userId is required for assignment',
          });
        }

        const assignee = await User.findById(assigneeId);
        if (!assignee) {
          return res.status(404).json({
            success: false,
            message: 'Assignee not found',
          });
        }

        const result = await Ticket.updateMany(ticketFilter, {
          $set: {
            assignedTo: assigneeId,
            status: 'in-progress',
            updatedAt: new Date(),
          },
        });

        return res.json({
          success: true,
          message: 'Tickets assigned successfully',
          data: { modified: result.modifiedCount },
        });
      }

      if (action === 'status') {
        const { status } = data || {};
        if (!status) {
          return res.status(400).json({
            success: false,
            message: 'status is required',
          });
        }

        const updateData = {
          status,
          updatedAt: new Date(),
        };

        // Set resolvedAt when status changes to resolved
        if (status === 'resolved') {
          updateData.resolvedAt = new Date();
        }

        const result = await Ticket.updateMany(ticketFilter, {
          $set: updateData,
        });

        return res.json({
          success: true,
          message: 'Ticket statuses updated successfully',
          data: { modified: result.modifiedCount },
        });
      }

      if (action === 'priority') {
        const { priority } = data || {};
        if (!priority) {
          return res.status(400).json({
            success: false,
            message: 'priority is required',
          });
        }

        const result = await Ticket.updateMany(ticketFilter, {
          $set: {
            priority,
            updatedAt: new Date(),
          },
        });

        return res.json({
          success: true,
          message: 'Ticket priorities updated successfully',
          data: { modified: result.modifiedCount },
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Unsupported bulk action',
      });
    } catch (error) {
      console.error('❌ Bulk operation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation',
        error: error.message,
      });
    }
  })
);

// ================================
// DELETE /api/tickets/:id - Delete ticket (admin only)
// ================================
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateTicketIdParam,
  asyncHandler(async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      await Ticket.findByIdAndDelete(req.params.id);

      logger.info(
        `Ticket deleted: ${req.params.id} by admin: ${req.user.email}`
      );

      res.json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      console.error('❌ Ticket deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete ticket',
        error: error.message,
      });
    }
  })
);

/**
 * @route   GET /api/tickets/admin/overview
 * @desc    Get comprehensive ticket overview for admin (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/admin/overview',
  authenticate,
  authorize('admin'),
  validatePagination,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      assignedTo,
      createdBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = req.query;

    // Build query
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo;
    }

    if (createdBy && createdBy !== 'all') {
      query.createdBy = createdBy;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { aiNotes: { $regex: search, $options: 'i' } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role skills')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(query),
    ]);

    // Get summary statistics
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      escalatedTickets,
      urgentTickets,
      highPriorityTickets,
      unassignedTickets,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in-progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
      Ticket.countDocuments({ status: 'escalated' }),
      Ticket.countDocuments({ priority: 'urgent' }),
      Ticket.countDocuments({ priority: 'high' }),
      Ticket.countDocuments({
        assignedTo: null,
        status: { $in: ['open', 'in-progress'] },
      }),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        tickets,
        summary: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
          escalatedTickets,
          urgentTickets,
          highPriorityTickets,
          unassignedTickets,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTickets: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  })
);

/**
 * @route   GET /api/tickets/admin/analytics
 * @desc    Get ticket analytics for admin dashboard (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/admin/analytics',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { period = '30' } = req.query; // days
    const startDate = new Date(
      Date.now() - parseInt(period) * 24 * 60 * 60 * 1000
    );

    // Get ticket analytics
    const analytics = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          avgResolutionTime: { $avg: '$actualResolutionTime' },
          slaBreaches: {
            $sum: { $cond: ['$slaBreached', 1, 0] },
          },
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
          byType: {
            $push: {
              type: '$type',
              count: 1,
            },
          },
        },
      },
    ]);

    // Get daily ticket creation trends
    const dailyTrends = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          created: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get moderator performance
    const moderatorPerformance = await Ticket.aggregate([
      {
        $match: {
          assignedTo: { $ne: null },
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'moderator',
        },
      },
      {
        $unwind: '$moderator',
      },
      {
        $group: {
          _id: '$assignedTo',
          moderatorName: { $first: '$moderator.name' },
          moderatorEmail: { $first: '$moderator.email' },
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0],
            },
          },
          avgResolutionTime: { $avg: '$actualResolutionTime' },
          slaBreaches: {
            $sum: { $cond: ['$slaBreached', 1, 0] },
          },
        },
      },
      {
        $addFields: {
          resolutionRate: {
            $cond: [
              { $gt: ['$totalAssigned', 0] },
              { $divide: ['$resolved', '$totalAssigned'] },
              0,
            ],
          },
        },
      },
      {
        $sort: { resolutionRate: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        analytics: analytics[0] || {
          totalTickets: 0,
          avgResolutionTime: 0,
          slaBreaches: 0,
          byStatus: [],
          byPriority: [],
          byType: [],
        },
        dailyTrends,
        moderatorPerformance,
        period: `${period} days`,
      },
    });
  })
);

module.exports = router;
