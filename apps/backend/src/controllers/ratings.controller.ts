import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { executeSubmitRating, fetchDriverRatingsList } from '../services/ratings.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const submitRating = async (req: AuthenticatedRequest, res: Response) => {
  const { rideId, stars, feedback } = req.body;

  if (!req.user || req.user.role !== 'PASSENGER') {
    return res.status(403).json(errorResponse('Access denied: Only passengers can rate rides'));
  }

  if (!rideId || typeof stars !== 'number') {
    return res.status(400).json(errorResponse('rideId and stars rating are required'));
  }

  if (stars < 1 || stars > 5) {
    return res.status(400).json(errorResponse('Stars rating must be between 1 and 5'));
  }

  try {
    const result = await executeSubmitRating(req.user.id, rideId, stars, feedback);
    return res.status(201).json(successResponse(result));
  } catch (err: any) {
    if (
      err.message === 'Ride not found or not requested by you' ||
      err.message === 'You have already rated this ride'
    ) {
      return res.status(404).json(errorResponse(err.message));
    }
    if (
      err.message === 'You can only rate completed rides' ||
      err.message === 'No driver was assigned to this ride'
    ) {
      return res.status(400).json(errorResponse(err.message));
    }
    console.error('Submit rating error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const getDriverRatings = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const list = await fetchDriverRatingsList(id);
    return res.json(successResponse(list));
  } catch (err: any) {
    console.error('Get driver ratings error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
