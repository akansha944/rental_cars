import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env, normalizeClientUrl } from './config/env';
import apiRoutes from './routes';
import { notFound, errorHandler } from './middleware/error';
import { LOCAL_DIR } from './utils/storage';

/** True when two origins are the same site (ignores trailing slash and optional www). */
function originsMatch(a: string, b: string): boolean {
  const na = normalizeClientUrl(a);
  const nb = normalizeClientUrl(b);
  if (na === nb) return true;
  try {
    const ua = new URL(na);
    const ub = new URL(nb);
    const host = (h: string) => h.replace(/^www\./i, '');
    return ua.protocol === ub.protocol && host(ua.hostname) === host(ub.hostname);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  // Render (and most hosts) put the app behind a reverse proxy, which sets the
  // X-Forwarded-For header. Trust the first proxy hop so express-rate-limit can
  // identify the real client IP. Only in production to avoid local spoofing.
  if (env.isProd) app.set('trust proxy', 1);

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
        // In production, allow the configured client URL (www / trailing slash tolerant).
        if (origin && originsMatch(origin, env.clientUrl)) {
          return callback(null, true);
        }
        if (env.isProd) {
          console.warn(`[cors] Blocked origin: ${origin} (expected ${env.clientUrl})`);
        }
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

  // If a signing link ever points at the API host by mistake, redirect to the frontend.
  app.get('/sign/:token', (req, res) => {
    res.redirect(302, `${env.clientUrl}/sign/${req.params.token}`);
  });

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
