require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const config = require('./config');

class App {
  constructor() {
    this.app = express();
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // Security headers
    this.app.use(helmet());
    
    // Rate limiting
    this.app.use(
      '/api',
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200, // limit each IP to 200 requests per windowMs
        message: 'Too many requests from this IP, please try again later'
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    this.app.use(cookieParser());

    // Data sanitization
    this.app.use(mongoSanitize());
    this.app.use(xss());
    this.app.use(hpp({
      whitelist: ['price', 'rating'] // params you want to allow duplicates for
    }));

    // Compression
    this.app.use(compression());

    // CORS
    this.app.use(cors(config.cors));

    // Logging
    this.app.use(morgan(config.app.isProduction ? 'combined' : 'dev'));

    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/api/v1/health', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date(),
        environment: config.app.env,
        version: config.app.version
      });
    });

    // API routes
    const apiRouter = express.Router();
    
    // Load routes with proper error handling
    const loadRoute = (routePath) => {
      try {
        return require(routePath);
      } catch (err) {
        console.error(`❌ Failed to load route: ${routePath}`, err);
        process.exit(1);
      }
    };

    apiRouter.use('/auth', loadRoute('./routes/auth.routes'));
    apiRouter.use('/products', loadRoute('./routes/product.routes'));
    apiRouter.use('/cart', loadRoute('./routes/cart.routes'));
    apiRouter.use('/orders', loadRoute('./routes/order.routes'));

    this.app.use('/api/v1', apiRouter);

    // 404 handler
    this.app.all('*', (req, res, next) => {
      res.status(404).json({
        success: false,
        message: `Can't find ${req.originalUrl} on this server`
      });
    });
  }

  initializeErrorHandling() {
    this.app.use((err, req, res, next) => {
      err.statusCode = err.statusCode || 500;
      err.status = err.status || 'error';

      if (config.app.isProduction) {
        console.error('⚠️ Error:', err.message);
        
        // Operational, trusted error: send message to client
        if (err.isOperational) {
          return res.status(err.statusCode).json({
            success: false,
            message: err.message
          });
        }
        
        // Programming or other unknown error: don't leak error details
        return res.status(500).json({
          success: false,
          message: 'Something went wrong!'
        });
      }

      // Development error handling
      console.error('⚠️ Error:', err.stack);
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack
      });
    });
  }

  initializeDatabase() {
    mongoose.connect(config.db.uri, config.db.options)
      .then(() => console.log('✅ MongoDB connection established'))
      .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
      });

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
      });
    });
  }

  start() {
    this.server = this.app.listen(config.app.port, () => {
      console.log(`🚀 Server running in ${config.app.env} mode on port ${config.app.port}`);
      console.log(`🌍 Frontend URL: ${config.app.frontendUrl}`);
      console.log(`📚 API Docs: ${config.app.docsUrl}`);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', err => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      this.server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', err => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });
  }
}

const server = new App();
server.start();

module.exports = server.app;