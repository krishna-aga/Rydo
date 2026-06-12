import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const method = req.method;
  const path = req.path;
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`[${method}] ${path} - Error Status: ${status} - Message: ${message}`, err.stack);

  return res.status(status).json(errorResponse(message));
};
