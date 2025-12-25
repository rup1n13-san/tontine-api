import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { sequelize } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import indexRoutes from './routes/index.js';
import tontineRoutes from './routes/tontine.routes.js';
import { sendError } from './utils/response.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());


// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tontine API is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger documentation
const swaggerDocument = YAML.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tontines', tontineRoutes);

// 404 handler
app.use((_req, res) => {
  sendError(res, 'Route not found', 404);
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';
  
  sendError(res, message, err.status || 500);
});

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized');
    }

    // Setup automatic cleanup of expired blacklisted tokens (every hour)
    const BlacklistedToken = (await import('./models/BlacklistedToken.js')).default;
    setInterval(async () => {
      try {
        await BlacklistedToken.cleanupExpired();
      } catch (error) {
        console.error('Blacklist cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;
