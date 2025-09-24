const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @route   GET /api/analytics/dashboard-stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Private
 */
router.get(
  '/dashboard-stats',
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Base queries - adjust based on user role
      let baseQuery = {};
      let userSpecificQuery = { user: userId };
      let assignedQuery = { assignedTo: userId };

      // Admin and moderators can see all tickets
      if (userRole === 'user') {
        // Regular users only see their own tickets
        baseQuery = { $or: [{ user: userId }, { assignedTo: userId }] };
      }

      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        userTickets,
        assignedToUser,
        todayCreated,
        todayResolved,
        overdueTickets,
        resolvedTicketsWithTime,
      ] = await Promise.all([
        Ticket.countDocuments(baseQuery),
        Ticket.countDocuments({ ...baseQuery, status: 'open' }),
        Ticket.countDocuments({ ...baseQuery, status: 'in-progress' }),
        Ticket.countDocuments({ ...baseQuery, status: 'resolved' }),
        Ticket.countDocuments({ ...baseQuery, status: 'closed' }),
        Ticket.countDocuments(userSpecificQuery),
        Ticket.countDocuments(assignedQuery),
        Ticket.countDocuments({
          ...baseQuery,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        Ticket.countDocuments({
          ...baseQuery,
          status: 'resolved',
          updatedAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        Ticket.countDocuments({
          ...baseQuery,
          status: { $in: ['open', 'in-progress'] },
          dueDate: { $lt: new Date() },
        }),
        Ticket.find({
          ...baseQuery,
          status: 'resolved',
          resolvedAt: { $exists: true },
        }).select('createdAt resolvedAt'),
      ]);

      // Calculate average resolution time
      let avgResolutionTime = 0;
      if (resolvedTicketsWithTime.length > 0) {
        const totalTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
          const resolutionTime =
            (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) /
            (1000 * 60 * 60); // hours
          return sum + resolutionTime;
        }, 0);
        avgResolutionTime =
          Math.round((totalTime / resolvedTicketsWithTime.length) * 10) / 10;
      }

      const stats = {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        userTickets,
        assignedToUser,
        avgResolutionTime,
        todayCreated,
        todayResolved,
        overdue: overdueTickets,
      };

      logger.info(`Dashboard stats fetched for user: ${req.user.email}`);

      res.json(stats);
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard statistics',
        message: error.message,
      });
    }
  })
);

module.exports = router;
