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
const allowedOrigins = [
  'https://shopeasy-igcc.onrender.com',
  'http://localhost:5173',
  'https://e-commerce-1c55.onrender.com',
  'https://easyshop-gdpw.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

this.app.use(cors(corsOptions));
this.app.options('*', cors(corsOptions)); // 👈 very important


    // Body parsing
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    this.app.use(cookieParser());

    // Data sanitization
    this.app.use(mongoSanitize());
    this.app.use(xss());
    this.app.use(hpp({ whitelist: ['price', 'rating'] }));

    // Compression
    this.app.use(compression());


    // Logging
    this.app.use(morgan(config.app.isProduction ? 'combined' : 'dev'));

    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  initializeRoutes() {
    this.app.get('/', (req, res) => {
    res.status(200).send('Welcome to the E-commerce API');
    });
    // Health check
    this.app.get('/api/v1/health', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'API is healthy',
        timestamp: new Date()
      });
    });

    // API routes
    const apiRouter = express.Router();
    
    // Load routes with error handling
    const loadRoute = (routePath, routeName) => {
      try {
        const router = require(routePath);
        apiRouter.use(`/${routeName}`, router);
        console.log(`✅ ${routeName} routes loaded successfully`);
      } catch (err) {
        console.error(`❌ Failed to load ${routeName} routes:`, err);
        process.exit(1);
      }
    };

    loadRoute('./routes/user.routes', 'users');
    loadRoute('./routes/auth.routes', 'auth');
    loadRoute('./routes/product.routes', 'products');
    loadRoute('./routes/cart.routes', 'cart');
    loadRoute('./routes/order.routes', 'orders');

    this.app.use('/api/v1', apiRouter);

    // 404 handler
    this.app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  initializeErrorHandling() {
    this.app.use((err, req, res, next) => {
      err.statusCode = err.statusCode || 500;
      err.status = err.status || 'error';

      if (config.app.isProduction) {
        console.error('Error:', err.message);
        return res.status(err.statusCode).json({
          success: false,
          message: err.isOperational ? err.message : 'Something went wrong!'
        });
      }

      console.error(err.stack);
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
      .then(() => console.log('✅ MongoDB connected successfully'))
      .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
      });

    mongoose.connection.on('error', err => console.error('MongoDB error:', err));
  }

  start() {
    this.server = this.app.listen(config.app.port, () => {
      console.log(`🚀 Server running on port ${config.app.port}`);
    });

    process.on('unhandledRejection', err => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      this.server.close(() => process.exit(1));
    });
  }
}

const server = new App();
server.start();

module.exports = server.app;