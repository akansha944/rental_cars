import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { ApiError } from '../utils/ApiError';

/**
 * Authenticates the request using the Bearer access token and attaches the
 * tenant-scoped auth context (userId, companyId, role) to req.auth.
 *
 * Tenant isolation: every downstream query MUST filter by req.auth.companyId.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing authentication token');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      companyId: payload.company,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}
