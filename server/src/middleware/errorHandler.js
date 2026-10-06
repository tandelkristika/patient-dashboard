const ApiError = require('../utils/ApiError');

// Express recognizes an error handler by its 4 parameters.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;

  // Mongoose schema validation failed
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Invalid MongoDB ID
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errors = undefined;
  }

  // Duplicate unique field
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    errors = undefined;
  }

  // JWT problems
  else if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError'
  ) {
    statusCode = 401;
    message = 'Invalid or expired token. Please log in again.';
    errors = undefined;
  }

  // Malformed JSON body
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Body too large
  else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  }

  // Unexpected errors
  else if (!(err instanceof ApiError)) {
    console.error('Unexpected error:', err);
    statusCode = 500;
    message = 'Something went wrong on our side. Please try again later.';
    errors = undefined;
  }

  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
