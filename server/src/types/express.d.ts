import { UserRole } from '../models/types';

declare global {
  namespace Express {
    interface AuthContext {
      userId: string;
      companyId: string;
      role: UserRole;
      name: string;
    }
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
