import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  advanceOrderStage,
  submitQCInspection,
  submitDispatch,
  broadcastDelayAlert,
  getPublicOrderTrack,
} from '../controllers/orderController.js';
import { verifyToken, requirePermission } from '../middlewares/authMiddleware.js';

const router = Router();

// Public Customer Tracking Link (no auth required)
router.get('/:id/public', getPublicOrderTrack);

// Authenticated Factory Staff & Admin Routes
router.use(verifyToken);

// Order List & Details
router.get('/', getOrders);
router.get('/:id', getOrderById);

// Create Order (Requires 'create_order' capability)
router.post('/', requirePermission('create_order'), createOrder);

// 1-Tap Stage Advancement
router.post('/:id/advance', advanceOrderStage);

// QC Inspection (Checklist + Photo Proof + Fail Loop)
router.post('/:id/qc', requirePermission('qc_check'), submitQCInspection);

// Dispatch (Delivery vs Self-Pickup)
router.post('/:id/dispatch', requirePermission('dispatch_ops'), submitDispatch);

// Proactive Delay Broadcast
router.post('/:id/delay', broadcastDelayAlert);

export default router;
