const { inngest } = require('../lib/inngest');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { analyzeTicketWithAI } = require('../services/aiService');
const { sendTicketNotification } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Process ticket with AI analysis and assignment
 */
const processTicketFunction = inngest.createFunction(
  {
    id: 'process-ticket',
    name: 'AI Ticket Processing',
  },
  { event: 'ticket/created' },
  async ({ event, step }) => {
    const { ticketId, title, description, priority, type, createdBy } =
      event.data;

    // Step 1: AI Analysis
    const aiAnalysis = await step.run('analyze-with-ai', async () => {
      try {
        logger.info(`Starting AI analysis for ticket: ${ticketId}`);

        const analysis = await analyzeTicketWithAI({
          title,
          description,
          priority,
          type,
        });

        logger.info(`AI analysis completed for ticket: ${ticketId}`);
        return analysis;
      } catch (error) {
        logger.error(`AI analysis failed for ticket: ${ticketId}`, error);
        // Return default analysis if AI fails
        return {
          requiredSkills: [type.toLowerCase()],
          priority: priority,
          aiNotes: 'AI analysis unavailable. Manual review recommended.',
          estimatedResolutionTime: 24,
          category: type,
        };
      }
    });

    // Step 2: Update ticket with AI analysis
    await step.run('update-ticket-with-ai', async () => {
      try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
          throw new Error(`Ticket not found: ${ticketId}`);
        }

        // Update ticket with AI analysis
        ticket.requiredSkills = aiAnalysis.requiredSkills || [];
        ticket.aiNotes = aiAnalysis.aiNotes || '';
        ticket.aiProcessed = true;
        ticket.estimatedResolutionTime =
          aiAnalysis.estimatedResolutionTime || 24;

        // Update priority if AI suggests a different one
        if (aiAnalysis.priority && aiAnalysis.priority !== ticket.priority) {
          ticket.priority = aiAnalysis.priority;
        }

        await ticket.save();
        logger.info(`Ticket updated with AI analysis: ${ticketId}`);

        return { success: true };
      } catch (error) {
        logger.error(
          `Failed to update ticket with AI analysis: ${ticketId}`,
          error
        );

        // Mark AI processing as failed but don't throw
        await Ticket.findByIdAndUpdate(ticketId, {
          aiProcessed: false,
          aiProcessingError: error.message,
        });

        return { success: false, error: error.message };
      }
    });

    // Step 3: Find and assign moderator - FIXED VERSION
    const assignmentResult = await step.run('assign-moderator', async () => {
      try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
          throw new Error(`Ticket not found: ${ticketId}`);
        }

        let assignedModerator = null;

        // Try to find moderators with matching skills
        if (ticket.requiredSkills && ticket.requiredSkills.length > 0) {
          logger.info(
            `Looking for moderators with skills: ${ticket.requiredSkills.join(
              ', '
            )}`
          );

          // Use the FIXED findModeratorsBySkills method
          const moderators = await User.findModeratorsBySkills(
            ticket.requiredSkills
          );

          if (moderators.length > 0) {
            logger.info(
              `Found ${moderators.length} moderators with matching skills`
            );

            // Calculate workload for each moderator
            const moderatorWorkloads = await Promise.all(
              moderators.map(async (moderator) => {
                const currentWorkload = await Ticket.countDocuments({
                  assignedTo: moderator._id,
                  status: { $in: ['open', 'in-progress'] },
                });

                return {
                  moderator,
                  workload: currentWorkload,
                };
              })
            );

            // Sort by workload (ascending) and select the least loaded
            moderatorWorkloads.sort((a, b) => a.workload - b.workload);
            assignedModerator = moderatorWorkloads[0].moderator;

            logger.info(
              `Selected moderator: ${assignedModerator.email} (workload: ${moderatorWorkloads[0].workload})`
            );
          } else {
            logger.info('No moderators found with matching skills');
          }
        }

        // If no skill-matched moderator found, assign to an admin
        if (!assignedModerator) {
          logger.info('Falling back to admin assignment');

          // Use the FIXED findAvailableAdmins method
          const admins = await User.findAvailableAdmins().limit(1);

          if (admins.length > 0) {
            assignedModerator = admins[0];
            logger.info(`Assigned to admin: ${assignedModerator.email}`);
          } else {
            logger.error('No available admins found!');
          }
        }

        // Assign the ticket if we found someone
        if (assignedModerator) {
          await ticket.assignTo(assignedModerator._id);

          logger.info(
            `✅ Ticket ${ticketId} assigned to ${assignedModerator.email}`
          );

          return {
            success: true,
            assignedTo: {
              id: assignedModerator._id,
              name: assignedModerator.name,
              email: assignedModerator.email,
              role: assignedModerator.role,
            },
          };
        } else {
          logger.warn(
            `❌ No suitable moderator or admin found for ticket: ${ticketId}`
          );
          return {
            success: false,
            reason: 'No available moderators or admins found',
          };
        }
      } catch (error) {
        logger.error(`❌ Failed to assign moderator for ticket: ${ticketId}`, {
          error: error.message,
          stack: error.stack,
        });

        return {
          success: false,
          error: error.message,
        };
      }
    });

    // Step 4: Send notification email
    if (assignmentResult.success && assignmentResult.assignedTo) {
      await step.run('send-notification', async () => {
        try {
          const ticket = await Ticket.findById(ticketId)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');

          if (!ticket) {
            throw new Error(`Ticket not found: ${ticketId}`);
          }

          await sendTicketNotification({
            ticket,
            assignee: assignmentResult.assignedTo,
            type: 'assignment',
          });

          logger.info(`Notification sent for ticket assignment: ${ticketId}`);
          return { success: true };
        } catch (error) {
          logger.error(
            `Failed to send notification for ticket: ${ticketId}`,
            error
          );
          // Don't fail the entire process if email fails
          return { success: false, error: error.message };
        }
      });
    }

    // Return summary
    return {
      ticketId,
      aiAnalysis,
      assignmentResult,
      processingComplete: true,
    };
  }
);

/**
 * Handle ticket assignment notifications
 */
const ticketAssignedFunction = inngest.createFunction(
  {
    id: 'ticket-assigned',
    name: 'Send Ticket Assignment Notification',
  },
  { event: 'ticket/assigned' },
  async ({ event, step }) => {
    const { ticketId, assignedTo, assignedBy, ticketTitle } = event.data;

    await step.run('send-assignment-notification', async () => {
      try {
        const [ticket, assignee, assigner] = await Promise.all([
          Ticket.findById(ticketId).populate('createdBy', 'name email'),
          User.findById(assignedTo),
          User.findById(assignedBy),
        ]);

        if (!ticket || !assignee) {
          throw new Error(
            `Missing data: ticket=${!!ticket}, assignee=${!!assignee}`
          );
        }

        await sendTicketNotification({
          ticket,
          assignee,
          assigner,
          type: 'assignment',
        });

        logger.info(
          `Assignment notification sent: ${ticketId} to ${assignee.email}`
        );
        return { success: true };
      } catch (error) {
        logger.error(
          `Failed to send assignment notification: ${ticketId}`,
          error
        );
        throw error;
      }
    });
  }
);

/**
 * Handle ticket escalation notifications
 */
const ticketEscalatedFunction = inngest.createFunction(
  {
    id: 'ticket-escalated',
    name: 'Send Ticket Escalation Notification',
  },
  { event: 'ticket/escalated' },
  async ({ event, step }) => {
    const { ticketId, escalatedBy, escalatedTo, reason, ticketTitle } =
      event.data;

    await step.run('send-escalation-notification', async () => {
      try {
        const [ticket, admin, escalator] = await Promise.all([
          Ticket.findById(ticketId).populate('createdBy', 'name email'),
          User.findById(escalatedTo),
          User.findById(escalatedBy),
        ]);

        if (!ticket || !admin) {
          throw new Error(`Missing data: ticket=${!!ticket}, admin=${!!admin}`);
        }

        await sendTicketNotification({
          ticket,
          assignee: admin,
          escalator,
          escalationReason: reason,
          type: 'escalation',
        });

        logger.info(
          `Escalation notification sent: ${ticketId} to ${admin.email}`
        );
        return { success: true };
      } catch (error) {
        logger.error(
          `Failed to send escalation notification: ${ticketId}`,
          error
        );
        throw error;
      }
    });
  }
);

/**
 * Handle SLA breach warnings
 */
const slaBreachWarningFunction = inngest.createFunction(
  {
    id: 'sla-breach-warning',
    name: 'Send SLA Breach Warning',
  },
  { event: 'sla/breach-warning' },
  async ({ event, step }) => {
    const { ticketId } = event.data;

    await step.run('send-sla-warning', async () => {
      try {
        const ticket = await Ticket.findById(ticketId)
          .populate('createdBy', 'name email')
          .populate('assignedTo', 'name email');

        if (!ticket) {
          throw new Error(`Ticket not found: ${ticketId}`);
        }

        // Send warning to assigned moderator and admins
        const recipients = [];

        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo);
        }

        // Also notify admins
        const admins = await User.find({ role: 'admin', isActive: true });
        recipients.push(...admins);

        // Remove duplicates
        const uniqueRecipients = recipients.filter(
          (recipient, index, self) =>
            index ===
            self.findIndex((r) => r._id.toString() === recipient._id.toString())
        );

        for (const recipient of uniqueRecipients) {
          await sendTicketNotification({
            ticket,
            assignee: recipient,
            type: 'sla-warning',
          });
        }

        logger.info(`SLA breach warning sent for ticket: ${ticketId}`);
        return { success: true };
      } catch (error) {
        logger.error(`Failed to send SLA warning: ${ticketId}`, error);
        throw error;
      }
    });
  }
);

/**
 * Daily SLA check function
 */
const dailySlaCheckFunction = inngest.createFunction(
  {
    id: 'daily-sla-check',
    name: 'Daily SLA Breach Check',
  },
  { cron: '0 9 * * *' }, // Run daily at 9 AM
  async ({ step }) => {
    await step.run('check-sla-breaches', async () => {
      try {
        const ticketsNearBreach = await Ticket.findNearSlaBreach(2); // 2 hours threshold

        logger.info(
          `Found ${ticketsNearBreach.length} tickets near SLA breach`
        );

        // Send warning for each ticket
        for (const ticket of ticketsNearBreach) {
          await inngest.send({
            name: 'sla/breach-warning',
            data: {
              ticketId: ticket._id.toString(),
            },
          });
        }

        // Mark tickets that have already breached
        const breachedTickets = await Ticket.find({
          status: { $in: ['open', 'in-progress'] },
          slaDueDate: { $lt: new Date() },
          slaBreached: { $ne: true },
        });

        for (const ticket of breachedTickets) {
          await ticket.checkSlaBreach();
        }

        logger.info(
          `SLA check completed. ${breachedTickets.length} tickets marked as breached`
        );

        return {
          ticketsNearBreach: ticketsNearBreach.length,
          ticketsBreached: breachedTickets.length,
        };
      } catch (error) {
        logger.error('Daily SLA check failed', error);
        throw error;
      }
    });
  }
);

module.exports = {
  processTicketFunction,
  ticketAssignedFunction,
  ticketEscalatedFunction,
  slaBreachWarningFunction,
  dailySlaCheckFunction,
};
