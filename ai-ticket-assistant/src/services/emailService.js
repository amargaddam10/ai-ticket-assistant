const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create reusable transporter
const createTransporter = () => {
  // Support both new SMTP and existing Mailtrap variables
  const config = {
    host: process.env.SMTP_HOST || process.env.MAILTRAP_SMTP_HOST,
    port:
      parseInt(process.env.SMTP_PORT || process.env.MAILTRAP_SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.MAILTRAP_SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.MAILTRAP_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  // Gmail specific configuration
  if (process.env.SMTP_HOST?.includes('gmail.com')) {
    config.service = 'gmail';
    config.secure = true;
    config.port = 465;
  }
  console.log('🔧 Email Config Debug:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    passLength: config.auth.pass ? config.auth.pass.length : 0,
    passFirst4: config.auth.pass
      ? config.auth.pass.substring(0, 4) + '****'
      : 'MISSING',
  });
  return nodemailer.createTransport(config);
};

/**
 * Send password reset email - NEW FUNCTIONALITY
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${
      process.env.APP_URL || process.env.FRONTEND_URL
    }/auth/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; }
          .footer { background-color: #6c757d; color: white; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 14px; }
          .reset-button { 
            display: inline-block; 
            padding: 15px 30px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          .warning-box { 
            background-color: #fff3cd; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #ffc107; 
          }
          .security-tips {
            background-color: #d1ecf1;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #0dcaf0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${userName || 'User'}</strong>,</p>
          
          <p>You recently requested to reset your password for your AI Ticket System account. Click the button below to reset it:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="reset-button">Reset My Password</a>
          </div>
          
          <div class="warning-box">
            <p><strong>⚠️ Important Security Information:</strong></p>
            <ul>
              <li>This link will expire in <strong>1 hour</strong> for your security</li>
              <li>This link can only be used once</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
          </div>
          
          <div class="security-tips">
            <p><strong>💡 Security Tips:</strong></p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Don't share your password with anyone</li>
              <li>Consider using a password manager</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">
            ${resetUrl}
          </p>
          
          <p>If you didn't request this password reset, someone may have entered your email address by mistake. You can safely ignore this email.</p>
          
          <p>Best regards,<br>
          The AI Ticket System Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated security notification from AI Ticket System</p>
          <p>Need help? Contact our support team</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Password Reset Request

Hello ${userName || 'User'},

You recently requested to reset your password for your AI Ticket System account.

Reset your password by visiting this link:
${resetUrl}

⚠️ IMPORTANT:
- This link expires in 1 hour
- This link can only be used once  
- If you didn't request this reset, please ignore this email

Security Tips:
- Use a strong, unique password
- Don't share your password with anyone
- Consider using a password manager

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The AI Ticket System Team
    `;

    const mailOptions = {
      from: `"AI Ticket System" <${
        process.env.EMAIL_FROM || 'noreply@aitickets.com'
      }>`,
      to: email,
      subject: '🔐 Reset Your Password - AI Ticket System',
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      `Password reset email sent successfully to ${email}: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
      recipient: email,
    };
  } catch (error) {
    logger.error(`Failed to send password reset email:`, error);
    throw error;
  }
};

/**
 * Send ticket notification email - EXISTING FUNCTION
 */
const sendTicketNotification = async ({
  ticket,
  assignee,
  assigner,
  escalator,
  escalationReason,
  type,
}) => {
  try {
    const transporter = createTransporter();

    let subject, htmlContent, textContent;

    switch (type) {
      case 'assignment':
        subject = `Ticket Assigned: ${ticket.title}`;
        ({ htmlContent, textContent } = generateAssignmentEmail(
          ticket,
          assignee,
          assigner
        ));
        break;

      case 'escalation':
        subject = `Ticket Escalated: ${ticket.title}`;
        ({ htmlContent, textContent } = generateEscalationEmail(
          ticket,
          assignee,
          escalator,
          escalationReason
        ));
        break;

      case 'sla-warning':
        subject = `SLA Warning: ${ticket.title}`;
        ({ htmlContent, textContent } = generateSlaWarningEmail(
          ticket,
          assignee
        ));
        break;

      case 'resolution':
        subject = `Ticket Resolved: ${ticket.title}`;
        ({ htmlContent, textContent } = generateResolutionEmail(ticket));
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const mailOptions = {
      from: `"AI Ticket System" <${process.env.EMAIL_FROM}>`,
      to: assignee.email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      `Email sent successfully to ${assignee.email}: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
      recipient: assignee.email,
    };
  } catch (error) {
    logger.error(`Failed to send email notification:`, error);
    throw error;
  }
};

/**
 * Generate assignment email content
 */
const generateAssignmentEmail = (ticket, assignee, assigner) => {
  const ticketUrl = `${process.env.APP_URL}/tickets/${ticket._id}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Assigned</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #6c757d; color: white; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; }
        .ticket-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .priority-${
          ticket.priority
        } { border-left: 4px solid ${getPriorityColor(ticket.priority)}; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .ai-notes { background-color: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .skills { background-color: #f0f0f0; padding: 8px; border-radius: 3px; display: inline-block; margin: 2px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎫 Ticket Assigned to You</h1>
      </div>
      
      <div class="content">
        <p>Hello <strong>${assignee.name}</strong>,</p>
        
        <p>A new support ticket has been assigned to you${
          assigner ? ` by ${assigner.name}` : ''
        }.</p>
        
        <div class="ticket-info priority-${ticket.priority}">
          <h3>${ticket.title}</h3>
          <p><strong>Ticket ID:</strong> #${ticket._id.toString().slice(-8)}</p>
          <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(
            ticket.priority
          )}; font-weight: bold; text-transform: uppercase;">${
    ticket.priority
  }</span></p>
          <p><strong>Type:</strong> ${ticket.type}</p>
          <p><strong>Created by:</strong> ${ticket.createdBy.name} (${
    ticket.createdBy.email
  })</p>
          <p><strong>Created:</strong> ${formatDate(ticket.createdAt)}</p>
          ${
            ticket.slaDueDate
              ? `<p><strong>SLA Due:</strong> ${formatDate(
                  ticket.slaDueDate
                )}</p>`
              : ''
          }
          
          <div style="margin: 15px 0;">
            <strong>Description:</strong>
            <p style="background: white; padding: 10px; border-radius: 3px; margin: 5px 0;">${
              ticket.description
            }</p>
          </div>
          
          ${
            ticket.requiredSkills && ticket.requiredSkills.length > 0
              ? `
          <div style="margin: 15px 0;">
            <strong>Required Skills:</strong><br>
            ${ticket.requiredSkills
              .map((skill) => `<span class="skills">${skill}</span>`)
              .join('')}
          </div>
          `
              : ''
          }
          
          ${
            ticket.aiNotes
              ? `
          <div class="ai-notes">
            <strong>🤖 AI Analysis:</strong>
            <p style="margin: 5px 0 0 0;">${ticket.aiNotes}</p>
          </div>
          `
              : ''
          }
          
          ${
            ticket.estimatedResolutionTime
              ? `
          <p><strong>Estimated Resolution Time:</strong> ${ticket.estimatedResolutionTime} hours</p>
          `
              : ''
          }
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${ticketUrl}" class="button">View Ticket Details</a>
        </div>
        
        <p>Please review the ticket and begin working on it at your earliest convenience.</p>
        
        <p>Best regards,<br>
        AI Ticket Management System</p>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from the AI Ticket System</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Ticket Assigned to You

Hello ${assignee.name},

A new support ticket has been assigned to you${
    assigner ? ` by ${assigner.name}` : ''
  }.

Ticket Details:
- Title: ${ticket.title}
- ID: #${ticket._id.toString().slice(-8)}
- Priority: ${ticket.priority.toUpperCase()}
- Type: ${ticket.type}
- Created by: ${ticket.createdBy.name} (${ticket.createdBy.email})
- Created: ${formatDate(ticket.createdAt)}
${ticket.slaDueDate ? `- SLA Due: ${formatDate(ticket.slaDueDate)}\n` : ''}

Description:
${ticket.description}

${
  ticket.requiredSkills && ticket.requiredSkills.length > 0
    ? `Required Skills: ${ticket.requiredSkills.join(', ')}\n`
    : ''
}

${ticket.aiNotes ? `AI Analysis:\n${ticket.aiNotes}\n` : ''}

${
  ticket.estimatedResolutionTime
    ? `Estimated Resolution Time: ${ticket.estimatedResolutionTime} hours\n`
    : ''
}

View ticket: ${ticketUrl}

Please review the ticket and begin working on it at your earliest convenience.

Best regards,
AI Ticket Management System
  `;

  return { htmlContent, textContent };
};

/**
 * Generate escalation email content
 */
const generateEscalationEmail = (ticket, admin, escalator, reason) => {
  const ticketUrl = `${process.env.APP_URL}/tickets/${ticket._id}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Escalated</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #6c757d; color: white; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; }
        .ticket-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .escalation-reason { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Ticket Escalated</h1>
      </div>
      
      <div class="content">
        <p>Hello <strong>${admin.name}</strong>,</p>
        
        <p>A support ticket has been escalated to you by ${
          escalator ? escalator.name : 'system'
        }.</p>
        
        <div class="ticket-info">
          <h3>${ticket.title}</h3>
          <p><strong>Ticket ID:</strong> #${ticket._id.toString().slice(-8)}</p>
          <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(
            ticket.priority
          )}; font-weight: bold; text-transform: uppercase;">${
    ticket.priority
  }</span></p>
          <p><strong>Type:</strong> ${ticket.type}</p>
          <p><strong>Customer:</strong> ${ticket.createdBy.name} (${
    ticket.createdBy.email
  })</p>
          <p><strong>Created:</strong> ${formatDate(ticket.createdAt)}</p>
          <p><strong>Escalated:</strong> ${formatDate(new Date())}</p>
          ${
            ticket.slaDueDate
              ? `<p><strong>SLA Due:</strong> ${formatDate(
                  ticket.slaDueDate
                )}</p>`
              : ''
          }
          
          <div style="margin: 15px 0;">
            <strong>Description:</strong>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin: 5px 0;">${
              ticket.description
            }</p>
          </div>
        </div>
        
        ${
          reason
            ? `
        <div class="escalation-reason">
          <strong>📝 Escalation Reason:</strong>
          <p style="margin: 5px 0 0 0;">${reason}</p>
        </div>
        `
            : ''
        }
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${ticketUrl}" class="button">Take Action Now</a>
        </div>
        
        <p><strong>⚠️ This ticket requires immediate admin attention.</strong></p>
        
        <p>Best regards,<br>
        AI Ticket Management System</p>
      </div>
      
      <div class="footer">
        <p>This is an automated escalation notification</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
🚨 TICKET ESCALATED

Hello ${admin.name},

A support ticket has been escalated to you by ${
    escalator ? escalator.name : 'system'
  }.

Ticket Details:
- Title: ${ticket.title}
- ID: #${ticket._id.toString().slice(-8)}
- Priority: ${ticket.priority.toUpperCase()}
- Type: ${ticket.type}
- Customer: ${ticket.createdBy.name} (${ticket.createdBy.email})
- Created: ${formatDate(ticket.createdAt)}
- Escalated: ${formatDate(new Date())}
${ticket.slaDueDate ? `- SLA Due: ${formatDate(ticket.slaDueDate)}\n` : ''}

Description:
${ticket.description}

${reason ? `Escalation Reason:\n${reason}\n` : ''}

⚠️ This ticket requires immediate admin attention.

View ticket: ${ticketUrl}

Best regards,
AI Ticket Management System
  `;

  return { htmlContent, textContent };
};

/**
 * Generate SLA warning email content
 */
const generateSlaWarningEmail = (ticket, assignee) => {
  const ticketUrl = `${process.env.APP_URL}/tickets/${ticket._id}`;
  const hoursUntilBreach = ticket.timeUntilSlaBreach;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SLA Warning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffc107; color: #212529; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #6c757d; color: white; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; }
        .warning-box { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
        .button { display: inline-block; padding: 10px 20px; background-color: #ffc107; color: #212529; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
        .urgent { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ SLA Breach Warning</h1>
      </div>
      
      <div class="content">
        <p>Hello <strong>${assignee.name}</strong>,</p>
        
        <div class="warning-box">
          <h3 class="urgent">⏰ Action Required</h3>
          <p>Ticket <strong>#${ticket._id
            .toString()
            .slice(-8)}</strong> is approaching SLA breach!</p>
          ${
            hoursUntilBreach !== null
              ? `<p><strong>Time remaining:</strong> <span class="urgent">${hoursUntilBreach} hours</span></p>`
              : ''
          }
        </div>
        
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>${ticket.title}</h3>
          <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(
            ticket.priority
          )}; font-weight: bold; text-transform: uppercase;">${
    ticket.priority
  }</span></p>
          <p><strong>Customer:</strong> ${ticket.createdBy.name}</p>
          <p><strong>Created:</strong> ${formatDate(ticket.createdAt)}</p>
          <p><strong>SLA Due:</strong> <span class="urgent">${formatDate(
            ticket.slaDueDate
          )}</span></p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${ticketUrl}" class="button">Take Action Now</a>
        </div>
        
        <p><strong>Please prioritize this ticket to avoid SLA breach.</strong></p>
        
        <p>Best regards,<br>
        AI Ticket Management System</p>
      </div>
      
      <div class="footer">
        <p>This is an automated SLA monitoring alert</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
⚠️ SLA BREACH WARNING

Hello ${assignee.name},

Ticket #${ticket._id.toString().slice(-8)} is approaching SLA breach!

${
  hoursUntilBreach !== null ? `Time remaining: ${hoursUntilBreach} hours\n` : ''
}

Ticket Details:
- Title: ${ticket.title}
- Priority: ${ticket.priority.toUpperCase()}
- Customer: ${ticket.createdBy.name}
- Created: ${formatDate(ticket.createdAt)}
- SLA Due: ${formatDate(ticket.slaDueDate)}

Please prioritize this ticket to avoid SLA breach.

View ticket: ${ticketUrl}

Best regards,
AI Ticket Management System
  `;

  return { htmlContent, textContent };
};

/**
 * Generate resolution email content
 */
const generateResolutionEmail = (ticket) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Resolved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background-color: #6c757d; color: white; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; }
        .success-box { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Ticket Resolved</h1>
      </div>
      
      <div class="content">
        <p>Hello <strong>${ticket.createdBy.name}</strong>,</p>
        
        <div class="success-box">
          <h3>Your support request has been resolved!</h3>
          <p>Ticket <strong>#${ticket._id.toString().slice(-8)}</strong> - "${
    ticket.title
  }" has been successfully resolved.</p>
        </div>
        
        ${
          ticket.resolution
            ? `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Resolution Details:</strong>
          <p style="margin: 5px 0 0 0;">${ticket.resolution}</p>
        </div>
        `
            : ''
        }
        
        <p>If you have any questions about the resolution or need further assistance, please don't hesitate to contact us.</p>
        
        <p>Thank you for using our support system!</p>
        
        <p>Best regards,<br>
        Support Team</p>
      </div>
      
      <div class="footer">
        <p>Thank you for your patience</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
✅ TICKET RESOLVED

Hello ${ticket.createdBy.name},

Your support request has been resolved!

Ticket #${ticket._id.toString().slice(-8)} - "${
    ticket.title
  }" has been successfully resolved.

${ticket.resolution ? `Resolution Details:\n${ticket.resolution}\n` : ''}

If you have any questions about the resolution or need further assistance, please don't hesitate to contact us.

Thank you for using our support system!

Best regards,
Support Team
  `;

  return { htmlContent, textContent };
};

/**
 * Helper functions
 */
const getPriorityColor = (priority) => {
  const colors = {
    urgent: '#dc3545',
    high: '#fd7e14',
    medium: '#ffc107',
    low: '#28a745',
  };
  return colors[priority] || '#6c757d';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

/**
 * Send bulk notification emails
 */
const sendBulkNotifications = async (notifications) => {
  const results = [];

  for (const notification of notifications) {
    try {
      const result = await sendTicketNotification(notification);
      results.push({ ...result, notification: notification.type });
    } catch (error) {
      logger.error(`Failed to send bulk notification:`, error);
      results.push({
        success: false,
        error: error.message,
        notification: notification.type,
      });
    }
  }

  return results;
};

/**
 * Test email configuration
 */
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    logger.info('Email configuration verified successfully');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return { success: false, error: error.message };
  }
};

// FIXED MODULE EXPORTS - This was the issue!
module.exports = {
  sendTicketNotification,
  sendPasswordResetEmail, // NEW - Added password reset functionality
  sendBulkNotifications,
  testEmailConfiguration,
};
