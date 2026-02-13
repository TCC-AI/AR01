import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, generateToken, type AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar: string | null;
  subscription: string;
  created_at: string;
  updated_at: string;
}

function formatUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    subscription: row.subscription,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      return;
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuid();

    db.prepare(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
    ).run(id, email, hashedPassword, name);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
    const token = generateToken(id);

    res.status(201).json({
      success: true,
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId!) as UserRow | undefined;

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      success: true,
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
