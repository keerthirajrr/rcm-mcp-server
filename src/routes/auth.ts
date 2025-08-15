import { Router } from 'express';
import { z } from 'zod';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import { logger } from '../utils/logger';

const router = Router();

// Mock user database - replace with real database
const mockUsers = [
  {
    id: 'user_1',
    username: 'admin',
    password_hash: '', // Will be set below
    role: 'admin' as const
  },
  {
    id: 'user_2', 
    username: 'billing_manager',
    password_hash: '', // Will be set below
    role: 'billing_manager' as const
  }
];

// Initialize with hashed passwords (in real app, this would be in database migration)
(async () => {
  mockUsers[0].password_hash = await hashPassword('admin123');
  mockUsers[1].password_hash = await hashPassword('billing123');
})();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      username: z.string().min(1),
      password: z.string().min(1)
    });

    const { username, password } = schema.parse(req.body);

    const user = mockUsers.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      user_id: user.id,
      username: user.username,
      role: user.role
    });

    logger.info('User logged in', { 
      user_id: user.id, 
      username: user.username,
      role: user.role
    });

    res.json({
      success: true,
      token,
      user: {
        user_id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors
      });
    }

    logger.error('Login failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/validate
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Token validation is handled by middleware, so if we get here, token is valid
    res.json({ valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;