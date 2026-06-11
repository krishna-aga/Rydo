import { Router } from 'express';
import { toggleStatus, updateLocation, getOnlineDrivers } from '../controllers/drivers.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.patch('/status', authenticateJWT, toggleStatus);
router.patch('/location', authenticateJWT, updateLocation);
router.get('/online', authenticateJWT, getOnlineDrivers);

export default router;
