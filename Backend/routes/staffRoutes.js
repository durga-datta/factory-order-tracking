import { Router } from 'express';
import { addStaff, getStaffList, updateStaff } from '../controllers/staffController.js';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// All staff management routes are Admin-only
router.use(verifyToken);
router.use(requireAdmin);

// POST /api/staff - Appoint new employee with custom permissions
router.post('/', addStaff);

// GET /api/staff - List all employees
router.get('/', getStaffList);

// PATCH /api/staff/:id - Edit permissions or status
router.patch('/:id', updateStaff);

export default router;
