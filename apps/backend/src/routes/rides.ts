import { Router } from 'express';
import {
  requestRide,
  acceptRide,
  cancelRide,
  getActiveRide,
  getAvailableRides,
  progressRideStatus
} from '../controllers/rides.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/request', authenticateJWT, requestRide);
router.post('/accept', authenticateJWT, acceptRide);
router.post('/cancel', authenticateJWT, cancelRide);
router.get('/active', authenticateJWT, getActiveRide);
router.get('/available', authenticateJWT, getAvailableRides);
router.patch('/:id/status', authenticateJWT, progressRideStatus);

export default router;
