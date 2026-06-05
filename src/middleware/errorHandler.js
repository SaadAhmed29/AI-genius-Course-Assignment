// Centralized error handler — sits at the bottom of the middleware stack.
// Any route that calls next(err) lands here.

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Something went wrong on the server.';

  // Log the full error in dev but don't leak stack traces to clients
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.path} →`, err);
  }

  return res.status(statusCode).json({
    status:  statusCode >= 500 ? 'error' : 'fail',
    message,
  });
}

module.exports = errorHandler;
