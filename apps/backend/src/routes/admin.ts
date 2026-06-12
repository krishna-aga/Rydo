import { Router } from 'express';
import { getPendingDrivers, verifyDriver } from '../controllers/admin.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/admin.js';

const router = Router();

router.get('/drivers/pending', authenticateJWT, requireAdmin, getPendingDrivers);
router.patch('/drivers/:id/verify', authenticateJWT, requireAdmin, verifyDriver);

export default router;
