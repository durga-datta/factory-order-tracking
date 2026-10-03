import { Router } from 'express';
import { createEnquiry, getEnquiries } from '../controllers/enquiryController.js';

const router = Router();

// Public endpoint for visitors on the landing page
router.post('/', createEnquiry);

// Staff/Admin endpoint to view enquiries
router.get('/', getEnquiries);

export default router;
