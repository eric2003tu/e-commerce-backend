// config.js
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  app: {
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL,
    docsUrl: process.env.API_DOCS_URL,
    isProduction
  },

  db: {
    uri: process.env.MONGODB_URI.replace(
      '<username>',
      process.env.DB_USER
    ).replace(
      '<password>',
      process.env.DB_PASSWORD
    ),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: !isProduction
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '30d',
    cookie: {
      secure: process.env.COOKIE_SECURE === 'true',
      httpOnly: true,
      sameSite: 'lax'
    }
  },

  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_WINDOW || '15') * 60 * 1000, // minutes to ms
    max: parseInt(process.env.API_RATE_LIMIT || '100')
  },

  cors: {
    origin: [
    'https://shopeasy-igcc.onrender.com',
    'http://localhost:5173' // For local development
  ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  }
};