import express from 'express';
import PaymentController from '../controllers/payment.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js'; 

const router = express.Router();

// App Routes (Requires user to be logged in)
router.get('/upi-details', authMiddleware, PaymentController.getUpiDetails);
router.post('/intent', authMiddleware, PaymentController.createIntent);
router.get('/status/:transaction_ref', authMiddleware, PaymentController.checkStatus);

// Admin Routes (To be used by the EJS admin panel)
router.get('/admin/all', PaymentController.getAllPayments);
router.put('/admin/:id/verify', PaymentController.verifyPayment);

export default router;