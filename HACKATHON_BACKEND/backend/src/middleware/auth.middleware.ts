import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { AuthenticatedUser } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      companyId?: string;
    }
  }
}

export const authenticateToken = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Demo / Dev auth token bypass
    if (env.DEMO_AUTH_ENABLED) {
      if (token === 'demo-customer-token' || token === 'customer-token') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'priya.customer@example.com',
          role: 'customer',
          company_id: '11111111-1111-1111-1111-111111111111',
        };
        return next();
      }

      if (token.startsWith('demo-') || token === 'mock-jwt-token' || token === 'test-token') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'agent.rahul@serviqx.com',
          role: 'admin',
          company_id: '11111111-1111-1111-1111-111111111111',
        };
        return next();
      }
    }

    if (!isSupabaseConfigured()) {
      if (env.DEMO_AUTH_ENABLED) {
        req.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@serviqx.com',
          role: 'admin',
          company_id: '11111111-1111-1111-1111-111111111111',
        };
        return next();
      }
      throw new UnauthorizedError('Supabase is not configured and demo auth is disabled');
    }

    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as string) || 'admin',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware for public customer chat widget endpoints
 * which can accept a session token if present, or continue as guest customer
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticateToken(req, _res, next);
};
