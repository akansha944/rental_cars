import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes';
import { notFound, errorHandler } from './middleware/error';
import { LOCAL_DIR } from './utils/storage';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin / tools with no origin (curl, health checks).
        if (!origin) return callback(null, true);
        // In development, accept any localhost / 127.0.0.1 port.
        if (!env.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        // In production, only the configured client URL is allowed.
        if (origin === env.clientUrl) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan('dev'));

  // Rate limit auth endpoints to slow brute-force attempts.
  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false })
  );

  // Serve locally-stored uploads when Cloudinary is not configured.
  app.use('/uploads', express.static(LOCAL_DIR));

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
