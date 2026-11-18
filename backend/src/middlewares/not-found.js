import { AppError } from '../utils/app-error.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found.`, 404));
}
