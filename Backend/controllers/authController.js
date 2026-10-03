import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'trackvriksha_jwt_secret_token_2026_xyz';

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your factory administrator.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Parse permissions array safely
    let permissions = [];
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === 'string'
          ? JSON.parse(user.permissions)
          : user.permissions;
      } catch (e) {
        permissions = [];
      }
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
      error: error.message,
    });
  }
}

// GET /api/auth/me
export async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, permissions, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    let permissions = [];
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === 'string'
          ? JSON.parse(user.permissions)
          : user.permissions;
      } catch (e) {
        permissions = [];
      }
    }

    return res.json({
      success: true,
      user: {
        ...user,
        permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
