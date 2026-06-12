import { Router } from 'express';
import { submitRating, getDriverRatings } from '../controllers/ratings.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { createRatingSchema } from '../schemas/ratings.schema.js';

const router = Router();

router.post('/', authenticateJWT, validateBody(createRatingSchema), submitRating);
router.get('/driver/:id', authenticateJWT, getDriverRatings);

export default router;
