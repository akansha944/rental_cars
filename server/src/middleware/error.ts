import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // Mongoose duplicate key
  if (typeof err === 'object' && err && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? 'field';
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }

  // Mongoose validation
  if (typeof err === 'object' && err && (err as { name?: string }).name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      details: (err as { errors?: unknown }).errors,
    });
  }

  console.error('[error]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({
    message: env.isProd ? 'Internal server error' : message,
  });
}
