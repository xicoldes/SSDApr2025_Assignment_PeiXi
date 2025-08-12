const logger = require('../utils/logger');

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, status: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, status: 401 };
  }

  // SQL Server errors
  if (err.number) {
    switch (err.number) {
      case 2: // Cannot open database
        error = { message: 'Database connection failed', status: 500 };
        break;
      case 208: // Invalid object name
        error = { message: 'Invalid table or column reference', status: 500 };
        break;
      case 515: // Cannot insert NULL
        error = { message: 'Required field is missing', status: 400 };
        break;
      case 547: // Foreign key violation
        error = { message: 'Referenced record does not exist', status: 400 };
        break;
      case 2627: // Duplicate key
        error = { message: 'Duplicate entry found', status: 409 };
        break;
      default:
        error = { message: 'Database error occurred', status: 500 };
    }
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  logger.warn(`404 - ${req.method} ${req.originalUrl} - ${req.ip}`);
  res.status(404);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};