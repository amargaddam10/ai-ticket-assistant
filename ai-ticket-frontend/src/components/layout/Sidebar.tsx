const express = require('express');
const cors = require('cors');
const winston = require('winston');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

// In-memory database (replace with real database later)
let tickets = [
  {
    _id: 'welcome-ticket-001',
    title: '🎉 Welcome to AI Ticket System!',
    description:
      'Your system is working perfectly! This is a sample ticket to show the functionality.',
    status: 'open',
    priority: 'high',
    createdAt: '2025-09-13T17:51:05.000Z',
    updatedAt: '2025-09-13T17:51:05.000Z',
    createdBy: {
      _id: 'mock-user-id-175776732397',
      name: 'System Admin',
      email: 'admin@system.com',
    },
    assignedTo: null,
    aiResponse:
      'Welcome to our AI-powered ticket management system! This system helps you efficiently manage and resolve support tickets with AI assistance. Features include automated prioritization, smart categorization, and AI-generated solutions.',
  },
];

let ticketCounter = 2; // Start from 2 since we have 1 existing ticket

// FIXED: Updated user email to match your login
const users = [
  {
    _id: 'mock-user-id-175776732397',
    name: 'amar',
    email: 'amar@gmail.com', // CHANGED from amar@example.com
  },
];

// AUTH ENDPOINTS
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  logger.info('Login attempt', { email });

  // Simple mock authentication
  const user = users.find((u) => u.email === email);
  if (user && password === 'password') {
    res.status(200).json({
      success: true,
      data: {
        user: user,
        token: 'mock-jwt-token-' + Date.now(),
      },
    });
  } else {
    logger.warn('Login failed', { email, reason: 'Invalid credentials' });
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
});

// TICKET ENDPOINTS

// Get all tickets with filters
app.get('/api/tickets', (req, res) => {
  logger.info('Fetching tickets', { query: req.query });

  let filteredTickets = [...tickets];

  // Apply filters
  const { status, priority, assignedTo, search, createdBy } = req.query;

  // CreatedBy filter (for My Tickets)
  if (createdBy) {
    const createdByArray = Array.isArray(createdBy) ? createdBy : [createdBy];
    filteredTickets = filteredTickets.filter((ticket) =>
      createdByArray.includes(ticket.createdBy._id)
    );
  }

  // AssignedTo filter
  if (assignedTo) {
    const assignedToArray = Array.isArray(assignedTo)
      ? assignedTo
      : [assignedTo];
    filteredTickets = filteredTickets.filter((ticket) => {
      return assignedToArray.some((assignedId) => {
        if (assignedId === 'unassigned') {
          return !ticket.assignedTo;
        }
        return ticket.assignedTo && ticket.assignedTo._id === assignedId;
      });
    });
  }

  // Status filter
  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    filteredTickets = filteredTickets.filter((ticket) =>
      statusArray.includes(ticket.status)
    );
  }

  // Priority filter
  if (priority) {
    const priorityArray = Array.isArray(priority) ? priority : [priority];
    filteredTickets = filteredTickets.filter((ticket) =>
      priorityArray.includes(ticket.priority)
    );
  }

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredTickets = filteredTickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
    );
  }

  // Sort by creation date (newest first)
  filteredTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: {
      tickets: paginatedTickets,
      pagination: {
        page: page,
        limit: limit,
        total: filteredTickets.length,
        totalPages: Math.ceil(filteredTickets.length / limit),
        hasNext: endIndex < filteredTickets.length,
        hasPrev: page > 1,
      },
    },
  });
});

// Create new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, priority = 'medium', userId } = req.body;

    logger.info('Creating new ticket', { title, priority, userId });

    // Find user
    const user = users.find((u) => u._id === userId);
    if (!user) {
      logger.error('User not found', { userId });
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate AI response (mock)
    const aiResponse = await generateAIResponse(title, description);

    // Create new ticket
    const newTicket = {
      _id: `ticket-${ticketCounter++}-${Date.now()}`,
      title,
      description,
      status: 'open',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      assignedTo: null,
      aiResponse,
    };

    // Add to tickets array
    tickets.push(newTicket);

    logger.info('Ticket created successfully', { 
      ticketId: newTicket._id, 
      totalTickets: tickets.length 
    });

    res.status(201).json({
      success: true,
      data: {
        ticket: newTicket,
      },
    });
  } catch (error) {
    logger.error('Error creating ticket', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
    });
  }
});

// Get single ticket by ID
app.get('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const ticket = tickets.find((t) => t._id === id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ticket,
    },
  });
});

// Update ticket
app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const ticketIndex = tickets.findIndex((t) => t._id === id);

  if (ticketIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found',
    });
  }

  // Update ticket
  tickets[ticketIndex] = {
    ...tickets[ticketIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    data: {
      ticket: tickets[ticketIndex],
    },
  });
});

// Mock AI response generator
async function generateAIResponse(title, description) {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock responses based on keywords
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  if (titleLower.includes('password') || descLower.includes('password')) {
    return 'To reset your password, please follow these steps:\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link to create a new password\n\nIf you continue to have issues, please contact IT support.';
  }

  if (titleLower.includes('login') || descLower.includes('login')) {
    return 'For login issues, please try:\n1. Clear your browser cache and cookies\n2. Disable browser extensions temporarily\n3. Try using an incognito/private browser window\n4. Ensure your credentials are correct\n5. Check if Caps Lock is enabled\n\nIf the problem persists, there might be a server issue. Please wait a few minutes and try again.';
  }

  if (
    titleLower.includes('bug') ||
    titleLower.includes('error') ||
    descLower.includes('error')
  ) {
    return 'Thank you for reporting this issue. To help us resolve it quickly:\n1. Please provide steps to reproduce the problem\n2. Include any error messages you see\n3. Mention your browser and operating system\n4. Attach screenshots if possible\n\nOur development team will investigate and provide an update within 24 hours.';
  }

  if (titleLower.includes('feature') || titleLower.includes('request')) {
    return "Thank you for your feature request! We appreciate user feedback.\n\nYour suggestion will be:\n1. Reviewed by our product team\n2. Evaluated for feasibility\n3. Added to our development roadmap if approved\n\nWe'll keep you updated on the status of this request. Feature implementations typically take 2-4 weeks depending on complexity.";
  }

  // Default response
  return (
    'Thank you for contacting support. We have received your request and our team will review it shortly.\n\nExpected response time: 24-48 hours\n\nFor urgent matters, please contact our emergency support line.\n\nTicket Reference: ' +
    Date.now()
  );
}

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === 'in-progress'
  ).length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;

  res.status(200).json({
    success: true,
    data: {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets: tickets.slice(-3).reverse(), // FIXED: Get latest 3 tickets
    },
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📧 Login with: amar@gmail.com / password`);
  logger.info(`Server running on port ${port}`);
});
