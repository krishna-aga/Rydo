import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@rydo/db';
import { ApiResponse } from '@rydo/shared';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rydo-super-secret-key-123456';

// POST /signup - Register passenger or driver
router.post('/signup', async (req, res) => {
  const { email, password, name, role, vehicleType, vehicleNumber } = req.body;
  const response: ApiResponse<any> = { success: false };

  if (!email || !password || !role) {
    response.error = 'Email, password, and role are required';
    return res.status(400).json(response);
  }

  if (role !== 'PASSENGER' && role !== 'DRIVER') {
    response.error = 'Invalid role (must be PASSENGER or DRIVER)';
    return res.status(400).json(response);
  }

  if (role === 'DRIVER' && (!vehicleType || !vehicleNumber)) {
    response.error = 'Vehicle details are required for drivers';
    return res.status(400).json(response);
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      response.error = 'Email is already registered';
      return res.status(409).json(response);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        driverProfile: role === 'DRIVER' ? {
          create: {
            vehicleType: vehicleType!,
            vehicleNumber: vehicleNumber!,
            verificationStatus: 'APPROVED'
          }
        } : undefined
      },
      include: {
        driverProfile: true
      }
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.success = true;
    response.data = {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name || undefined,
        role: newUser.role,
        createdAt: newUser.createdAt.toISOString()
      }
    };
    return res.status(201).json(response);
  } catch (err: any) {
    console.error('Signup error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// POST /login - Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const response: ApiResponse<any> = { success: false };

  if (!email || !password) {
    response.error = 'Email and password are required';
    return res.status(400).json(response);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { driverProfile: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      response.error = 'Invalid email or password';
      return res.status(401).json(response);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.success = true;
    response.data = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      }
    };
    return res.json(response);
  } catch (err: any) {
    console.error('Login error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// GET /me - Check profile
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const response: ApiResponse<any> = { success: false };

  if (!req.user) {
    response.error = 'Not authenticated';
    return res.status(401).json(response);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { driverProfile: true }
    });

    if (!user) {
      response.error = 'User not found';
      return res.status(404).json(response);
    }

    response.success = true;
    response.data = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      },
      driver: user.driverProfile ? {
        id: user.driverProfile.id,
        vehicleType: user.driverProfile.vehicleType,
        vehicleNumber: user.driverProfile.vehicleNumber,
        isOnline: user.driverProfile.isOnline,
        verificationStatus: user.driverProfile.verificationStatus,
        rating: user.driverProfile.rating
      } : undefined
    };
    return res.json(response);
  } catch (err: any) {
    console.error('Me check error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

export default router;
