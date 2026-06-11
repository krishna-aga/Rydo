import { Router, Response } from 'express';
import { prisma } from '@rydo/db';
import { ApiResponse } from '@rydo/shared';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /request - Create a new ride booking (Passenger only)
router.post('/request', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { pickupLocation, destination, fare } = req.body;
  const response: ApiResponse<any> = { success: false };

  if (!req.user || req.user.role !== 'PASSENGER') {
    response.error = 'Access denied: Only passengers can request rides';
    return res.status(403).json(response);
  }

  if (!pickupLocation || !destination || !fare) {
    response.error = 'Pickup, destination, and fare are required';
    return res.status(400).json(response);
  }

  try {
    // Check if passenger already has an active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        passengerId: req.user.id,
        status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] }
      }
    });

    if (activeRide) {
      response.error = 'You already have an active ride request';
      return res.status(400).json(response);
    }

    const newRide = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickupLocation,
        destination,
        fare: parseFloat(fare),
        status: 'REQUESTED'
      },
      include: {
        passenger: {
          select: { name: true, email: true }
        }
      }
    });

    response.success = true;
    response.data = newRide;
    return res.status(201).json(response);
  } catch (err: any) {
    console.error('Request ride error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// POST /accept - Accept an incoming ride request (Driver only)
router.post('/accept', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { rideId } = req.body;
  const response: ApiResponse<any> = { success: false };

  if (!req.user || req.user.role !== 'DRIVER') {
    response.error = 'Access denied: Only drivers can accept rides';
    return res.status(403).json(response);
  }

  if (!rideId) {
    response.error = 'rideId is required';
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

    if (!driver.isOnline) {
      response.error = 'You must go online to accept rides';
      return res.status(400).json(response);
    }

    // Check if driver already has an active ride
    const activeDriverRide = await prisma.ride.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['ACCEPTED', 'IN_PROGRESS'] }
      }
    });

    if (activeDriverRide) {
      response.error = 'You are already handling an active ride';
      return res.status(400).json(response);
    }

    // Database transaction to prevent race conditions (double accept)
    const updatedRide = await prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id: rideId }
      });

      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.status !== 'REQUESTED' || ride.driverId) {
        throw new Error('Ride already accepted or cancelled');
      }

      return tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'ACCEPTED',
          driverId: driver.id
        },
        include: {
          passenger: {
            select: { name: true, email: true }
          },
          driver: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      });
    });

    response.success = true;
    response.data = updatedRide;
    return res.json(response);
  } catch (err: any) {
    console.error('Accept ride error:', err.message);
    response.error = err.message || 'Internal server error';
    return res.status(400).json(response);
  }
});

// POST /cancel - Cancel a ride request
router.post('/cancel', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { rideId } = req.body;
  const response: ApiResponse<any> = { success: false };

  if (!rideId) {
    response.error = 'rideId is required';
    return res.status(400).json(response);
  }

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!ride) {
      response.error = 'Ride not found';
      return res.status(404).json(response);
    }

    // Validate ownership
    if (req.user?.role === 'PASSENGER' && ride.passengerId !== req.user.id) {
      response.error = 'Access denied: You cannot cancel someone else\'s ride';
      return res.status(403).json(response);
    }

    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      response.error = 'Ride is already closed';
      return res.status(400).json(response);
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED' }
    });

    response.success = true;
    response.data = updatedRide;
    return res.json(response);
  } catch (err: any) {
    console.error('Cancel ride error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// GET /active - Get current active ride for passenger or driver
router.get('/active', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const response: ApiResponse<any> = { success: false };

  if (!req.user) {
    response.error = 'Not authenticated';
    return res.status(401).json(response);
  }

  try {
    let activeRide = null;

    if (req.user.role === 'PASSENGER') {
      activeRide = await prisma.ride.findFirst({
        where: {
          passengerId: req.user.id,
          status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] }
        },
        include: {
          passenger: {
            select: { name: true, email: true }
          },
          driver: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      });
    } else {
      const driver = await prisma.driver.findUnique({
        where: { userId: req.user.id }
      });
      if (driver) {
        activeRide = await prisma.ride.findFirst({
          where: {
            driverId: driver.id,
            status: { in: ['ACCEPTED', 'IN_PROGRESS'] }
          },
          include: {
            passenger: {
              select: { name: true, email: true }
            },
            driver: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        });
      }
    }

    response.success = true;
    response.data = activeRide;
    return res.json(response);
  } catch (err: any) {
    console.error('Get active ride error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// GET /available - List all unassigned ride requests (Driver only)
router.get('/available', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const response: ApiResponse<any> = { success: false };

  if (!req.user || req.user.role !== 'DRIVER') {
    response.error = 'Access denied: Only drivers can list available rides';
    return res.status(403).json(response);
  }

  try {
    const requestedRides = await prisma.ride.findMany({
      where: {
        status: 'REQUESTED',
        driverId: null
      },
      include: {
        passenger: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    response.success = true;
    response.data = requestedRides;
    return res.json(response);
  } catch (err: any) {
    console.error('Get available rides error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

// PATCH /:id/status - Progress ride lifecycle states (Driver only: ACCEPTED -> IN_PROGRESS -> COMPLETED)
router.patch('/:id/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const rideId = req.params.id;
  const response: ApiResponse<any> = { success: false };

  if (!req.user || req.user.role !== 'DRIVER') {
    response.error = 'Access denied: Only drivers can update ride status';
    return res.status(403).json(response);
  }

  if (status !== 'IN_PROGRESS' && status !== 'COMPLETED') {
    response.error = 'Invalid status transition';
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

    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!ride || ride.driverId !== driver.id) {
      response.error = 'Ride not found or not assigned to you';
      return res.status(404).json(response);
    }

    // Validate lifecycle transitions
    if (status === 'IN_PROGRESS' && ride.status !== 'ACCEPTED') {
      response.error = 'Ride must be accepted before starting';
      return res.status(400).json(response);
    }
    if (status === 'COMPLETED' && ride.status !== 'IN_PROGRESS') {
      response.error = 'Ride must be in progress before completing';
      return res.status(400).json(response);
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { status },
      include: {
        passenger: {
          select: { name: true, email: true }
        },
        driver: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    response.success = true;
    response.data = updatedRide;
    return res.json(response);
  } catch (err: any) {
    console.error('Update ride status error:', err);
    response.error = 'Internal server error';
    return res.status(500).json(response);
  }
});

export default router;
