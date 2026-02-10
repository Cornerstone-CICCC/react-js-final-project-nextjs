import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies access token from cookie or Authorization header
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Try to get token from cookie first (more secure)
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header (for mobile apps, API testing)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }

  // Attach user info to request
  req.user = payload;
  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block request if invalid
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.accessToken || req.headers.authorization?.substring(7);

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
