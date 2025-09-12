// src/middlewares/error.middleware.js

/**
 * Global error-handling middleware
 * Any error passed with next(err) will be caught here
 */
function errorHandler(err, req, res, next) {
  console.error('Error middleware caught:', err);

  const status = err.status || 500;
  const message = err.message || 'Something went wrong on the server.';

  res.status(status).json({
    success: false,
    message,
    // Only include stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
