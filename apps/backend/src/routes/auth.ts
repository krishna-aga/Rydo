import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);

export default router;
