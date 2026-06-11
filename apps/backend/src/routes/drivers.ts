import { Router, Response } from 'express';
import { prisma } from '@rydo/db';
import { ApiResponse } from '@rydo/shared';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// PATCH /status - Toggle online/offline status
router.patch('/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { isOnline } = req.body;
  const response: ApiResponse<any> = { success: false };

  if (!req.user || req.user.role !== 'DRIVER') {
    response.error = 'Access denied: Only drivers can toggle status';
    return res.status(403).json(response);
  }

  if (typeof isOnline !== 'boolean') {
    response.error = 'isOnline boolean is required';
    return res.status(400).json(response);
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: req.user.id }
    });

    if (!driver) {
      response.error = 'Driver profile not found';
      return res.status(404).json(response);
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline },
      include: { user: true }
    });

    response.success = true;
    response.data = {
      id: updatedDriver.id,
      userId: updatedDriver.userId,
      vehicleType: updatedDriver.vehicleType,
      vehicleNumber: updatedDriver.vehicleNumber,
      isOnline: updatedDriver.isOnline,
      verificationStatus: updatedDriver.verificationStatus,
      rating: updatedDriver.rating
    };
    return res.json(response);
  } catch (err: any) {
    console.error('Toggle status error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// GET /online - Fetch all online drivers (so passengers can see them)
router.get('/online', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const response: ApiResponse<any> = { success: false };

  try {
    const onlineDrivers = await prisma.driver.findMany({
      where: { isOnline: true },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    response.success = true;
    response.data = onlineDrivers.map(d => ({
      id: d.id,
      name: d.user.name || 'Anonymous',
      vehicleType: d.vehicleType,
      vehicleNumber: d.vehicleNumber,
      rating: d.rating
    }));
    return res.json(response);
  } catch (err: any) {
    console.error('Get online drivers error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

export default router;
