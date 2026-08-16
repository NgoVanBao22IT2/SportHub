const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public Webhook IPN Endpoint (No JWT required, secured via Signature)
router.post('/momo-ipn', PaymentController.momoIpnCallback);

// Protected Endpoints
router.use(authMiddleware.authenticateJWT);

router.post('/', PaymentController.createPayment);
router.get('/:id', PaymentController.getPaymentStatus);
router.post('/:id/proof', PaymentController.uploadProof);
router.post('/:id/refunds', PaymentController.refundPayment);

module.exports = router;
