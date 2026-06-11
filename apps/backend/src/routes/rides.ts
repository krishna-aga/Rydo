import { Router } from 'express';
import {
  requestRide,
  acceptRide,
  cancelRide,
  getActiveRide,
  getAvailableRides,
  progressRideStatus
} from '../controllers/rides.controller.js';
import {
  bookSchedule,
  getUpcomingSchedules,
  cancelSchedule
} from '../controllers/scheduled.controller.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

router.post('/request', authenticateJWT, requestRide);
router.post('/accept', authenticateJWT, acceptRide);
router.post('/cancel', authenticateJWT, cancelRide);
router.get('/active', authenticateJWT, getActiveRide);
router.get('/available', authenticateJWT, getAvailableRides);
router.patch('/:id/status', authenticateJWT, progressRideStatus);

// Scheduling Routes
router.post('/schedule', authenticateJWT, bookSchedule);
router.get('/scheduled/upcoming', authenticateJWT, getUpcomingSchedules);
router.delete('/scheduled/:id', authenticateJWT, cancelSchedule);

export default router;
