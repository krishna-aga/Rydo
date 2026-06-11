import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { fetchDashboardData } from '../services/dashboard.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json(errorResponse('Access denied: Only drivers can query dashboard stats'));
  }

  try {
    const data = await fetchDashboardData(req.user.id);
    return res.json(successResponse(data));
  } catch (err: any) {
    if (err.message === 'Driver profile not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    console.error('Fetch dashboard stats error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
