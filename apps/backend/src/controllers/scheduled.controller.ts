import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { createScheduledRide, fetchUpcomingScheduledRides, cancelScheduledRide } from '../services/scheduled.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const bookSchedule = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Unauthorized'));
  }

  const { pickupLocation, destination, fare, scheduledTime } = req.body;

  if (!pickupLocation || !destination || !fare || !scheduledTime) {
    return res.status(400).json(errorResponse('pickupLocation, destination, fare, and scheduledTime are required'));
  }

  try {
    const data = await createScheduledRide(req.user.id, { pickupLocation, destination, fare, scheduledTime });
    return res.json(successResponse(data));
  } catch (err: any) {
    console.error('Book schedule error:', err);
    return res.status(400).json(errorResponse(err.message || 'Failed to book schedule'));
  }
};

export const getUpcomingSchedules = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Unauthorized'));
  }

  try {
    const data = await fetchUpcomingScheduledRides(req.user.id);
    return res.json(successResponse(data));
  } catch (err: any) {
    console.error('Fetch upcoming schedules error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const cancelSchedule = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Unauthorized'));
  }

  const { id } = req.params;

  try {
    const data = await cancelScheduledRide(req.user.id, id);
    return res.json(successResponse(data));
  } catch (err: any) {
    console.error('Cancel schedule error:', err);
    return res.status(400).json(errorResponse(err.message || 'Failed to cancel schedule'));
  }
};
