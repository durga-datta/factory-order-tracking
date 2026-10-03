import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'trackvriksha_jwt_secret_token_2026_xyz';

// Middleware to verify JWT token
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email, role, permissions }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

// Middleware to require Admin role
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. This action requires Administrator privileges.',
    });
  }
  next();
}

// Middleware to check specific permission for Staff (Admins always pass)
export function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Admin has full bypass access
    if (req.user.role === 'admin') {
      return next();
    }

    const permissions = req.user.permissions || [];
    if (permissions.includes(permissionKey)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission denied: Missing '${permissionKey}' authorization. Contact your factory admin.`,
    });
  };
}
