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
import { validateBody } from '../middlewares/validate.js';
import {
  requestRideSchema,
  acceptRideSchema,
  scheduleRideSchema
} from '../schemas/rides.schema.js';

const router = Router();

router.post('/request', authenticateJWT, validateBody(requestRideSchema), requestRide);
router.post('/accept', authenticateJWT, validateBody(acceptRideSchema), acceptRide);
router.post('/cancel', authenticateJWT, cancelRide);
router.get('/active', authenticateJWT, getActiveRide);
router.get('/available', authenticateJWT, getAvailableRides);
router.patch('/:id/status', authenticateJWT, progressRideStatus);

// Scheduling Routes
router.post('/schedule', authenticateJWT, validateBody(scheduleRideSchema), bookSchedule);
router.get('/scheduled/upcoming', authenticateJWT, getUpcomingSchedules);
router.delete('/scheduled/:id', authenticateJWT, cancelSchedule);

export default router;
