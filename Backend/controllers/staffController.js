import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

// POST /api/staff - Admin appoints new staff member with granular roles
export async function addStaff(req, res) {
  try {
    const { name, email, phone, password, permissions } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required to appoint an employee.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An employee account with this email already exists.',
      });
    }

    // Hash employee temporary or assigned password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const permissionsJson = JSON.stringify(permissions || [
      'create_order',
      'update_spec',
      'production_ops',
    ]);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, permissions, status)
       VALUES (?, ?, ?, ?, 'staff', ?, 'active')`,
      [name.trim(), cleanEmail, phone.trim(), passwordHash, permissionsJson]
    );

    return res.status(201).json({
      success: true,
      message: `Employee ${name} successfully appointed.`,
      staffId: result.insertId,
    });
  } catch (error) {
    console.error('Error adding staff member:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add staff member.',
      error: error.message,
    });
  }
}

// GET /api/staff - Admin lists all staff members
export async function getStaffList(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, permissions, status, created_at FROM users WHERE role = "staff" ORDER BY created_at DESC'
    );

    const formattedStaff = rows.map((staff) => {
      let perms = [];
      if (staff.permissions) {
        try {
          perms = typeof staff.permissions === 'string'
            ? JSON.parse(staff.permissions)
            : staff.permissions;
        } catch (e) {
          perms = [];
        }
      }
      return {
        ...staff,
        permissions: perms,
      };
    });

    return res.json({
      success: true,
      data: formattedStaff,
    });
  } catch (error) {
    console.error('Error fetching staff list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff list.',
    });
  }
}

// PATCH /api/staff/:id - Admin updates permissions or status
export async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const { permissions, status, phone, name } = req.body;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone.trim());
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update provided.' });
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND role = "staff"`,
      values
    );

    return res.json({
      success: true,
      message: 'Staff member updated successfully.',
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update staff member.',
    });
  }
}
