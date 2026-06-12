import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

router.get('/stats', authenticateJWT, getDashboardStats);

export default router;
