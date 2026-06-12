import { Router } from 'express';
import { getAnalyticsStats } from '../controllers/analytics.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateJWT, getAnalyticsStats);

export default router;
