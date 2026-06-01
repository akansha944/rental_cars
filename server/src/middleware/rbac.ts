import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/types';
import { ApiError } from '../utils/ApiError';

/**
 * Restricts a route to the given roles. Owner implicitly has access to
 * everything, so it is always allowed.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw ApiError.unauthorized();
    if (req.auth.role === UserRole.Owner) return next();
    if (!roles.includes(req.auth.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
