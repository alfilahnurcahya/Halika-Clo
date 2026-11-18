export function errorHandler(err, req, res, next) {
  // Avoid writing a second response if headers have already been sent.
  if (res.headersSent) return next(err);

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode >= 500 ? 'Internal server error.' : err.message;

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({ success: false, message, data: null });
}
