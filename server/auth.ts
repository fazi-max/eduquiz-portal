import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'eduquiz_super_secret_jwt_key_2026_dev_mode';

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Hashes a plaintext password securely using bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compares plaintext password against a stored bcrypt hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generates a signed JWT for the authenticated user
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'EduQuiz Portal'
  });
}

/**
 * Express Middleware: Enforces that requests contain a valid Bearer JWT
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      error: 'Access denied. Authentication token missing. Please sign in to EduQuiz Portal.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { iat?: number };
    const user = db.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: 'Your account has been suspended or blocked by the Administrator.' });
      return;
    }
    if (user.forceLoggedOutAt && decoded.iat && decoded.iat * 1000 < new Date(user.forceLoggedOutAt).getTime()) {
      res.status(401).json({ error: 'You have been logged out by Administrator. Please sign in again.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      error: 'Invalid or expired authentication token. Please sign in again.'
    });
    return;
  }
}

/**
 * Express Middleware: Restricts access to users with role 'admin'
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Administrator access required for this operation.'
    });
    return;
  }
  next();
}

/**
 * Express Middleware: Optional authentication token reader
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      req.user = decoded;
    } catch {
      // ignore invalid token in optional context
    }
  }
  next();
}
