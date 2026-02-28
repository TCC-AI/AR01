import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ar01-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.userId) as { id: string } | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
