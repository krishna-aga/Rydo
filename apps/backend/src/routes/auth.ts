import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { signupSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticateJWT, getMe);

export default router;
