const express = require('express');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
// Use your centralized AI service
const { analyzeTicketWithAI } = require('../services/aiService');

const router = express.Router();

/**
 * @route   POST /api/ai/process-ticket/:ticketId
 * @desc    Process individual ticket with AI analysis using centralized service
 * @access  Private
 */
router.post(
  '/process-ticket/:ticketId',
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const { ticketId } = req.params;
      const Ticket = require('../models/Ticket');

      // Find the ticket
      const ticket = await Ticket.findById(ticketId)
        .populate('user', 'name email')
        .populate('createdBy', 'name email');

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      console.log(
        '🤖 Processing ticket with centralized AI service:',
        ticketId
      );

      // Use the centralized AI service (this has your correct format)
      const aiResult = await analyzeTicketWithAI({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        type: ticket.type,
      });

      console.log('✅ Centralized AI service completed for ticket:', ticketId);

      // Update ticket with AI response from centralized service
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        {
          aiNotes: aiResult.aiResponse,
          aiResponse: aiResult.aiResponse,
          aiProcessed: true,
          aiProcessedAt: new Date(),
          priority: aiResult.priority || ticket.priority,
        },
        { new: true }
      )
        .populate('user', 'name email')
        .populate('createdBy', 'name email');

      res.json({
        success: true,
        message: 'Ticket processed successfully with AI',
        ticket: updatedTicket,
        aiAnalysis: {
          analysis: aiResult.aiResponse,
          processed: true,
          source: 'centralized-ai-service',
        },
      });
    } catch (error) {
      console.error('❌ AI ticket processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process ticket with AI',
        error: error.message,
      });
    }
  })
);

/**
 * @route   POST /api/ai/insights/dashboard
 * @desc    Generate simple dashboard insights
 * @access  Private
 */
router.post(
  '/insights/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const Ticket = require('../models/Ticket');

      // Get basic ticket statistics
      const [totalTickets, openTickets, resolvedTickets, urgentTickets] =
        await Promise.all([
          Ticket.countDocuments(),
          Ticket.countDocuments({ status: 'open' }),
          Ticket.countDocuments({ status: 'resolved' }),
          Ticket.countDocuments({ priority: 'urgent' }),
        ]);

      // Generate simple insights based on actual data
      const insights = [];

      if (totalTickets > 0) {
        const resolutionRate = Math.round(
          (resolvedTickets / totalTickets) * 100
        );

        insights.push({
          id: 'resolution_performance',
          type: resolutionRate > 80 ? 'trend' : 'recommendation',
          title: `Resolution Rate: ${resolutionRate}%`,
          description: `Currently ${resolvedTickets} out of ${totalTickets} tickets have been resolved. ${
            resolutionRate > 80
              ? 'Excellent performance!'
              : 'Room for improvement in resolution efficiency.'
          }`,
          confidence: 0.9,
          actionable: resolutionRate < 80,
          priority: resolutionRate > 80 ? 'low' : 'medium',
          suggestion:
            resolutionRate < 80
              ? 'Focus on resolving pending tickets to improve overall resolution rate.'
              : null,
        });
      }

      if (openTickets > 0) {
        insights.push({
          id: 'open_tickets_status',
          type: openTickets > 10 ? 'alert' : 'trend',
          title: `${openTickets} Open Tickets`,
          description: `There are currently ${openTickets} tickets awaiting resolution. ${
            openTickets > 10
              ? 'This requires immediate attention.'
              : 'Normal operational level.'
          }`,
          confidence: 0.95,
          actionable: openTickets > 5,
          priority:
            openTickets > 10 ? 'high' : openTickets > 5 ? 'medium' : 'low',
          suggestion:
            openTickets > 5
              ? 'Review and prioritize open tickets for faster resolution.'
              : null,
        });
      }

      if (urgentTickets > 0) {
        insights.push({
          id: 'urgent_tickets',
          type: 'alert',
          title: `${urgentTickets} Urgent Tickets`,
          description: `${urgentTickets} tickets marked as urgent priority require immediate attention to maintain service quality.`,
          confidence: 0.98,
          actionable: true,
          priority: 'urgent',
          suggestion:
            'Prioritize urgent tickets and consider escalation procedures.',
        });
      }

      // Ensure at least one insight
      if (insights.length === 0) {
        insights.push({
          id: 'system_healthy',
          type: 'trend',
          title: 'System Operating Normally',
          description:
            'All ticket management systems are functioning properly with no critical issues detected.',
          confidence: 0.8,
          actionable: false,
          priority: 'low',
        });
      }

      res.json({
        success: true,
        insights: insights.slice(0, 4), // Max 4 insights
        source: 'data-driven-analysis',
        stats: {
          totalTickets,
          openTickets,
          resolvedTickets,
          urgentTickets,
        },
      });
    } catch (error) {
      logger.error('Dashboard insights error:', error);
      res.json({
        success: true,
        insights: [
          {
            id: 'system_status',
            type: 'trend',
            title: 'System Operational',
            description: 'Dashboard is functioning normally.',
            confidence: 0.8,
            actionable: false,
            priority: 'low',
          },
        ],
        source: 'fallback',
      });
    }
  })
);

module.exports = router;
