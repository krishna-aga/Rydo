import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { errorResponse } from '../utils/response.js';

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json(errorResponse('Access denied: Administrator privileges required'));
  }
  next();
};
