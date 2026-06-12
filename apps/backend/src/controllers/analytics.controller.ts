import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { fetchAnalyticsData } from '../services/analytics.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAnalyticsStats = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Unauthorized: Authentication required'));
  }

  try {
    const data = await fetchAnalyticsData();
    return res.json(successResponse(data));
  } catch (err: any) {
    console.error('Fetch analytics error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
