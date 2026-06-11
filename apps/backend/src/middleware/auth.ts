import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rydo-super-secret-key-123456';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'PASSENGER' | 'DRIVER';
  };
}

export const authenticateJWT = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Forbidden: Invalid token' });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }
};
