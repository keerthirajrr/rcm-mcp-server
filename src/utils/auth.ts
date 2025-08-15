import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export interface AuthUser {
  user_id: string;
  username: string;
  role: 'admin' | 'billing_manager' | 'biller' | 'readonly';
  scopes: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// HIPAA-compliant scopes
export const SCOPES = {
  'rcm.claim.read': 'Read claim information',
  'rcm.claim.write': 'Create/update claims',
  'rcm.denial.read': 'Read denial information',
  'rcm.denial.write': 'Create/update denials',
  'rcm.appeal.read': 'Read appeal information',
  'rcm.appeal.write': 'Create/update appeals',
  'rcm.patient.read': 'Read patient information',
  'rcm.analytics.read': 'Read analytics and reports'
};

const ROLE_SCOPES: Record<string, string[]> = {
  admin: Object.keys(SCOPES),
  billing_manager: [
    'rcm.claim.read', 'rcm.claim.write',
    'rcm.denial.read', 'rcm.denial.write',
    'rcm.appeal.read', 'rcm.appeal.write',
    'rcm.analytics.read'
  ],
  biller: [
    'rcm.claim.read', 'rcm.claim.write',
    'rcm.denial.read', 'rcm.appeal.read'
  ],
  readonly: [
    'rcm.claim.read', 'rcm.denial.read',
    'rcm.appeal.read', 'rcm.analytics.read'
  ]
};

export function generateToken(user: Omit<AuthUser, 'scopes'>): string {
  const scopes = ROLE_SCOPES[user.role] || [];
  const payload: AuthUser = { ...user, scopes };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireScope(scope: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.scopes.includes(scope)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        required_scope: scope 
      });
    }

    next();
  };
}