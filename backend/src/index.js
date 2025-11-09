require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3088;

// Track initialization state
let isReady = false;

// ==================== SECURITY & MIDDLEWARE ====================

// Trust proxy - required for rate limiting behind Cloud Run proxy
app.set('trust proxy', 1);

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
  })
);

// Logging
app.use(morgan('combined'));

// Rate limiting (disabled for testing)
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
//   message: 'Too many requests, please try again later.',
// });
// app.use('/api/', limiter);

// ==================== STATIC & ROUTES ====================

// Health check endpoint - returns 503 until ready
app.get('/health', (req, res) => {
  if (!isReady) {
    return res.status(503).json({ status: 'SERVICE_INITIALIZING', timestamp: new Date().toISOString() });
  }
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Fun Writing Backend API',
    env: process.env.NODE_ENV || 'development',
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const writingRoutes = require('./routes/writing');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');
const internalRoutes = require('./routes/internal');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/internal', internalRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ==================== DATABASE & SERVER ====================

/**
 * Initialize database and start server
 */
async function startServer() {
  try {
    console.log('🚀 Starting initialization...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models
    // Note: Using alter: false to avoid Sequelize migration issues with ENUMs
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');

    console.log('📂 All initialization complete, starting server...');

    // Mark as ready and start server AFTER all initialization
    isReady = true;

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Fun Writing Backend API Running      ║
║   Port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}        ║
╚════════════════════════════════════════╝
      `);
      console.log('✅ Service is ready to accept requests');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        sequelize.close().then(() => {
          console.log('Database connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
