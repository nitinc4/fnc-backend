import express from 'express';
import PaymentController from '../controllers/payment.controller.js';
// FIXED: Using the named export { authenticateRequest } instead of a default export
import { authenticateRequest } from '../middlewares/auth.middleware.js'; 

const router = express.Router();

// App Routes (Requires user to be logged in)
router.get('/upi-details', authenticateRequest, PaymentController.getUpiDetails);
router.post('/intent', authenticateRequest, PaymentController.createIntent);
router.get('/status/:transaction_ref', authenticateRequest, PaymentController.checkStatus);

// Admin Routes
router.get('/admin/all', PaymentController.getAllPayments);
router.put('/admin/:id/verify', PaymentController.verifyPayment);
router.put('/admin/upi-details', PaymentController.updateUpiDetails); // <--- ADD THIS LINE

export default router;