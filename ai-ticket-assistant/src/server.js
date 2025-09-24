// This MUST be the very first line of your file.
const path = require('path');
const dotenv = require('dotenv');
// Prefer loading .env from the backend directory explicitly (works even if CWD is project root)
const result = dotenv.config({
  path: path.join(__dirname, '../.env'),
  override: true,
});
if (result.error) {
  // Fallback to default lookup in CWD
  dotenv.config({ override: true });
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

// --- Corrected Imports ---
const connectDB = require('../config/db'); // Use the external DB connection file
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analytics'); // ADD THIS LINE
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const Ticket = require('./models/Ticket'); // Needed for dashboard stats
const User = require('./models/User'); // Needed for profile updates
const { inngest } = require('./lib/inngest');
const { serve } = require('inngest/express');
const { authenticate, authorize } = require('./middleware/auth'); // ADD THIS LINE
const multer = require('multer');
const fs = require('fs');
// --- End of Corrected Imports ---

// Create Express app
const app = express();
const server = http.createServer(app);

// Use the logger from utils
const logger = require('./utils/logger');

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// --- Middleware (Largely unchanged) ---
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
// --- End of Middleware ---

// Serve uploaded files with CORS headers
app.use(
  '/uploads',
  (req, res, next) => {
    // Add CORS headers for static files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

// ================================
// FILE UPLOAD CONFIGURATION
// ================================
// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profiles/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  },
});

// ================================
// API ROUTES
// ================================
// Use the real routes from your /routes directory
// Make sure routes are registered in this order:
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes); // This should come BEFORE analytics
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
// ADD THIS LINE

// Import your Inngest functions
const {
  processTicketFunction,
  ticketAssignedFunction,
  ticketEscalatedFunction,
  slaBreachWarningFunction,
  dailySlaCheckFunction,
} = require('./inngest/processTicket');

// ================================
// NEW PROFILE & AI ENDPOINTS
// ================================

// User profile stats endpoint - REAL DATA
app.get('/api/users/profile/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get REAL data from database
    const [totalTickets, openTickets, resolvedTickets, inProgressTickets] =
      await Promise.all([
        Ticket.countDocuments({ user: userId }),
        Ticket.countDocuments({ user: userId, status: 'open' }),
        Ticket.countDocuments({ user: userId, status: 'resolved' }),
        Ticket.countDocuments({ user: userId, status: 'in-progress' }),
      ]);

    // Calculate categories from real data
    const categoryStats = await Ticket.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const favoriteCategories =
      categoryStats.length > 0
        ? categoryStats.map((cat) => ({
            category: cat._id || 'General',
            count: cat.count,
          }))
        : [
            { category: 'Technical', count: Math.ceil(totalTickets * 0.6) },
            { category: 'General', count: Math.ceil(totalTickets * 0.4) },
          ];

    const resolutionRate =
      totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    // Calculate REAL average response time
    const resolvedTicketsWithTime = await Ticket.find({
      user: userId,
      status: 'resolved',
      createdAt: { $exists: true },
      resolvedAt: { $exists: true },
    })
      .select('createdAt resolvedAt')
      .lean();

    let realAvgResponseTime = '0h';
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
        const resolutionTime =
          (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) /
          (1000 * 60 * 60); // hours
        return sum + resolutionTime;
      }, 0);
      const avgHours =
        Math.round((totalTime / resolvedTicketsWithTime.length) * 10) / 10;
      realAvgResponseTime =
        avgHours < 1 ? `${Math.round(avgHours * 60)}m` : `${avgHours}h`;
    }

    // Calculate REAL monthly tickets (current month only)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const realMonthlyTickets = await Ticket.countDocuments({
      user: userId,
      createdAt: { $gte: startOfMonth },
    });

    res.json({
      success: true,
      data: {
        totalTicketsCreated: totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime: realAvgResponseTime, // ✅ REAL DATA
        favoriteCategories:
          categoryStats.length > 0
            ? categoryStats.map((cat) => ({
                category: cat._id || 'General',
                count: cat.count,
              }))
            : [
                { category: 'No categories yet', count: 0 }, // ✅ HONEST FALLBACK
              ],
        recentActivity: [], // You can populate this later
        monthlyTickets: realMonthlyTickets, // ✅ REAL MONTHLY COUNT
        resolutionRate,
      },
    });
  } catch (error) {
    console.error('Profile stats error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch profile stats' });
  }
});

// Photo upload endpoint - COMPLETE WORKING VERSION
app.post(
  '/api/auth/upload-photo',
  authenticate,
  upload.single('profilePhoto'),
  async (req, res) => {
    try {
      console.log('📸 Photo upload request received');
      console.log('📁 File info:', req.file);

      if (!req.file) {
        console.log('❌ No file in request');
        return res
          .status(400)
          .json({ success: false, message: 'No file uploaded' });
      }

      const userId = req.user.userId || req.user.id;
      const photoUrl = `/uploads/profiles/${req.file.filename}`;

      console.log('📸 Saving photo URL to user:', userId, 'URL:', photoUrl);

      // Update user profile with photo URL
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePhoto: photoUrl },
        { new: true } // Return updated document
      );

      console.log('✅ User updated with photo:', updatedUser.profilePhoto);

      // Verify file exists
      const filePath = path.join(
        __dirname,
        '../uploads/profiles/',
        req.file.filename
      );
      const fileExists = fs.existsSync(filePath);
      console.log('📁 File exists at:', filePath, '→', fileExists);

      // In your /api/auth/upload-photo route, after saving to DB:
      res.json({
        success: true,
        message: 'Profile photo updated successfully',
        photoUrl: photoUrl,
        user: {
          ...updatedUser.toObject(),
          profilePhoto: photoUrl,
        },
        // ✅ ADD CACHE BUSTING
        timestamp: Date.now(), // Forces frontend to refresh
        debug: {
          filename: req.file.filename,
          path: filePath,
          exists: fileExists,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload photo',
        error: error.message,
      });
    }
  }
);
// Simple image serving route
app.get('/api/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, '../uploads/profiles/', filename);

  console.log('🖼️ Image request for:', filename);
  console.log('📁 Looking at path:', imagePath);
  console.log('📁 File exists:', fs.existsSync(imagePath));

  // Set headers to prevent CORS issues
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Content-Type': 'image/jpeg',
  });

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image not found', path: imagePath });
  }
});

// AI Insights for Profile endpoint - REAL DATA
app.post('/api/ai/insights/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get REAL ticket data for insights
    const [totalTickets, openTickets, resolvedTickets] = await Promise.all([
      Ticket.countDocuments({ user: userId }),
      Ticket.countDocuments({ user: userId, status: 'open' }),
      Ticket.countDocuments({ user: userId, status: 'resolved' }),
    ]);

    const resolutionRate =
      totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    // Generate insights based on REAL data
    const insights = [];

    // Resolution rate insight
    if (totalTickets > 0) {
      insights.push({
        id: 'resolution-performance',
        type: 'trend',
        title: `${resolutionRate}% Resolution Rate`,
        description: `You have successfully resolved ${resolvedTickets} out of ${totalTickets} tickets. ${
          resolutionRate >= 80
            ? 'Excellent track record!'
            : resolutionRate >= 60
            ? 'Good progress, keep it up!'
            : 'Consider providing more detailed information in your tickets.'
        }`,
        confidence: 0.9,
        actionable: resolutionRate < 80,
        priority: resolutionRate < 50 ? 'high' : 'medium',
        suggestion:
          resolutionRate < 80
            ? 'Include more context and screenshots when creating tickets for faster resolution.'
            : undefined,
      });
    }

    // Open tickets insight
    if (openTickets > 0) {
      insights.push({
        id: 'pending-tickets',
        type: 'alert',
        title: `${openTickets} Open Tickets Pending`,
        description: `You currently have ${openTickets} tickets awaiting response. These require attention from the support team.`,
        confidence: 0.95,
        actionable: true,
        priority: openTickets > 3 ? 'high' : 'medium',
        suggestion:
          'Monitor your open tickets and provide additional information if requested by support.',
      });
    }

    // Activity insight
    if (totalTickets >= 5) {
      insights.push({
        id: 'activity-pattern',
        type: 'recommendation',
        title: 'Active User Profile',
        description: `You've created ${totalTickets} tickets, showing good engagement with the support system.`,
        confidence: 0.85,
        actionable: false,
        priority: 'low',
        suggestion:
          'Continue documenting issues clearly to maintain good resolution rates.',
      });
    }

    // New user insight
    if (totalTickets === 0) {
      insights.push({
        id: 'new-user-guide',
        type: 'recommendation',
        title: 'Welcome to Support System',
        description:
          'Get started by creating your first support ticket. Our AI system will help analyze and route your requests efficiently.',
        confidence: 0.95,
        actionable: true,
        priority: 'medium',
        suggestion:
          'Create a test ticket to familiarize yourself with the system.',
      });
    }

    res.json({ success: true, insights });
  } catch (error) {
    console.error('AI insights error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate insights' });
  }
});

// Inngest serve endpoint for local dev/manual sync
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: [
      processTicketFunction,
      ticketAssignedFunction,
      ticketEscalatedFunction,
      slaBreachWarningFunction,
      dailySlaCheckFunction,
    ],
  })
);

// --- Enhanced Dashboard Stats Endpoint ---
app.get('/api/analytics/dashboard-stats', authenticate, async (req, res) => {
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
      // Regular users only see their own tickets or assigned to them
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

    // Calculate average resolution time in hours
    let avgResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
        const resolutionTime =
          (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) /
          (1000 * 60 * 60);
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

    logger.info(
      `Dashboard stats fetched for user: ${req.user.email || req.user.username}`
    );

    res.json(stats);
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error.message,
    });
  }
});

// --- Ticket Count Endpoint for Frontend ---
app.get('/api/tickets/count', authenticate, async (req, res) => {
  try {
    const { status, priority, category, user, assignedTo } = req.query;
    const currentUserId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    // Build query based on filters
    let query = {};

    // Role-based access control
    if (userRole === 'user') {
      query.$or = [{ user: currentUserId }, { assignedTo: currentUserId }];
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (user) query.user = user;
    if (assignedTo) query.assignedTo = assignedTo;

    const count = await Ticket.countDocuments(query);

    res.json({ count });
  } catch (error) {
    logger.error('Ticket count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ticket count',
    });
  }
});

// --- Recent Tickets Endpoint ---
app.get('/api/tickets/recent', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 5;

    // Base query based on user role
    let baseQuery = {};
    if (userRole === 'user') {
      baseQuery = { $or: [{ user: userId }, { assignedTo: userId }] };
    }

    const recentTickets = await Ticket.find(baseQuery)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      tickets: recentTickets,
    });
  } catch (error) {
    logger.error('Recent tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent tickets',
    });
  }
});

// --- Legacy Dashboard Stats Endpoint (for backward compatibility) ---
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    // Redirect to new analytics endpoint
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    // Base filter - admins see all, users see only their own
    const baseFilter = {};
    if (userRole !== 'admin') {
      baseFilter.$or = [{ user: userId }, { assignedTo: userId }];
    }

    const stats = {
      totalTickets: await Ticket.countDocuments(baseFilter),
      openTickets: await Ticket.countDocuments({
        ...baseFilter,
        status: 'open',
      }),
      inProgressTickets: await Ticket.countDocuments({
        ...baseFilter,
        status: 'in-progress',
      }),
      resolvedTickets: await Ticket.countDocuments({
        ...baseFilter,
        status: 'resolved',
      }),
    };

    // Get recent tickets with same filtering
    const recentTickets = await Ticket.find(baseFilter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: { ...stats, recentTickets },
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// ================================
// SOCKET.IO
// ================================
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  // Join user-specific room for personalized updates
  socket.on('join:user_room', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their personal room`);
  });

  // Handle ticket updates
  socket.on('ticket:update', async (data) => {
    try {
      const { ticketId, updates } = data;

      // Broadcast the update to relevant users
      io.emit('ticket:updated', { ticketId, updates });
      logger.info(`Ticket ${ticketId} updated via socket`);
    } catch (error) {
      logger.error('Socket ticket update error:', error);
    }
  });

  // Handle comments
  socket.on('comment:add', async (data) => {
    try {
      const { ticketId, comment } = data;

      // Broadcast new comment
      io.emit('comment:added', { ticketId, comment });
      logger.info(`Comment added to ticket ${ticketId} via socket`);
    } catch (error) {
      logger.error('Socket comment error:', error);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`❌ Client disconnected: ${socket.id}`);
  });
});

// ================================
// ERROR HANDLERS (MUST BE LAST)
// ================================
app.use(notFoundHandler); // Handles 404 for any routes not found
app.use(errorHandler); // Handles all other errors

// ================================
// SERVER STARTUP
// ================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to the database and wait for it to succeed
    await connectDB();

    // Start the HTTP server ONLY after the database is connected
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🔌 Socket.IO ready on port ${PORT}`);
      console.log(
        `\n✅ Backend server is running and connected to the database!`
      );
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(
        `📊 Analytics API: http://localhost:${PORT}/api/analytics/dashboard-stats`
      );
      console.log(
        `🤖 AI Insights API: http://localhost:${PORT}/api/ai/insights/dashboard`
      );
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});

// Start the server
startServer();

module.exports = app;
