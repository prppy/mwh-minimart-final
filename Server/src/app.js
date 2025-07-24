// Server/src/app.js
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { connectDB } from './lib/db.js';
import mainRoutes from './routes/mainRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

// Static files for images
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', mainRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Prisma error handling
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: {
        message: 'A record with this information already exists.',
        code: 'DUPLICATE_ENTRY'
      }
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: {
        message: 'Record not found.',
        code: 'NOT_FOUND'
      }
    });
  }
  
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: {
        message: 'Invalid reference to related record.',
        code: 'FOREIGN_KEY_CONSTRAINT'
      }
    });
  }

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: { 
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method
    } 
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;