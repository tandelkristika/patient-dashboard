const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const ApiError = require('./utils/ApiError');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody } = require('./middleware/sanitizeBody');
const {
  buildCorsOptions,
  getTrustProxy,
} = require('./config/deployment');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Trust the configured number of reverse proxies in production.
// Example: Render/Railway usually use 1 proxy.
app.set('trust proxy', getTrustProxy(process.env.TRUST_PROXY));

// Security headers
app.use(helmet());

// Only allow configured frontend origins to call this API
app.use(cors(buildCorsOptions()));

// Parse JSON request bodies
app.use(express.json({ limit: '10kb' }));

// Sanitize request bodies against MongoDB operator injection
app.use(sanitizeBody);

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limit every /api request
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Patient Dashboard API is running',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Patient routes
app.use('/api/patients', patientRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Unknown routes
app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

// Central error handler MUST be last
app.use(errorHandler);

module.exports = app;
