import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole } from '../types/models.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    // If no token, check for development/demo header or continue unauthenticated
    const demoRole = req.headers['x-demo-role'] as UserRole;
    if (demoRole && ['Admin', 'Staff', 'Customer'].includes(demoRole)) {
      req.user = {
        id: `demo-${demoRole.toLowerCase()}`,
        email: `${demoRole.toLowerCase()}@brightloop.io`,
        role: demoRole,
        name: `Demo ${demoRole} User`,
      };
      next();
      return;
    }

    // Allow unauthenticated requests through unless protected by requireAuth/requireRole
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required for this operation' });
    return;
  }
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In fallback mode if no user is specified, allow request
    if (env.DB_FALLBACK_MODE && !req.user) {
      next();
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Operation requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
