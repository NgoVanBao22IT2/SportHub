const express = require('express');
const router = express.Router();
const SlotBlockingController = require('../controllers/slot-blocking.controller');
const rbacMiddleware = require('../middleware/rbac.middleware');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all routes with OWNER role
router.use(authMiddleware.authenticateJWT);
router.use(rbacMiddleware.requireRole('OWNER'));

// POST /api/v1/owner/courts/:courtId/blocks
router.post('/courts/:courtId/blocks', SlotBlockingController.createBlock);

// DELETE /api/v1/owner/blocks/:blockId
router.delete('/blocks/:blockId', SlotBlockingController.deleteBlock);

module.exports = router;
