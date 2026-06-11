import { Router } from 'express';
import { submitRating, getDriverRatings } from '../controllers/ratings.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateJWT, submitRating);
router.get('/driver/:id', authenticateJWT, getDriverRatings);

export default router;
