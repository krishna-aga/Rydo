import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { registerUser, authenticateUser, getUserProfile } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const signup = async (req: Request, res: Response) => {
  const { email, password, name, role, vehicleType, vehicleNumber } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json(errorResponse('Email, password, and role are required'));
  }

  if (role !== 'PASSENGER' && role !== 'DRIVER') {
    return res.status(400).json(errorResponse('Invalid role (must be PASSENGER or DRIVER)'));
  }

  if (role === 'DRIVER' && (!vehicleType || !vehicleNumber)) {
    return res.status(400).json(errorResponse('Vehicle details are required for drivers'));
  }

  try {
    const data = await registerUser(req.body);
    
    // Notify admins in real-time if a driver registers
    if (role === 'DRIVER' && data.driverProfile) {
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('driver-registered', {
          id: data.driverProfile.id,
          userId: data.user.id,
          name: data.user.name || 'Anonymous',
          email: data.user.email,
          vehicleType: data.driverProfile.vehicleType,
          vehicleNumber: data.driverProfile.vehicleNumber,
          verificationStatus: data.driverProfile.verificationStatus,
          createdAt: data.user.createdAt
        });
      }
    }

    return res.status(201).json(successResponse(data));
  } catch (err: any) {
    if (err.message === 'Email is already registered') {
      return res.status(409).json(errorResponse(err.message));
    }
    console.error('Signup error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(errorResponse('Email and password are required'));
  }

  try {
    const data = await authenticateUser(req.body);
    return res.json(successResponse(data));
  } catch (err: any) {
    if (err.message === 'Invalid email or password') {
      return res.status(401).json(errorResponse(err.message));
    }
    console.error('Login error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Not authenticated'));
  }

  try {
    const data = await getUserProfile(req.user.id);
    return res.json(successResponse(data));
  } catch (err: any) {
    if (err.message === 'User not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    console.error('Me check error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
