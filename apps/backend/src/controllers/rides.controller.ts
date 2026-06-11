import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  createRideRequest,
  executeRideAccept,
  executeRideCancel,
  fetchActiveRideInfo,
  fetchAvailableRidesList,
  updateRideStatusLifecycle
} from '../services/rides.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const requestRide = async (req: AuthenticatedRequest, res: Response) => {
  const { pickupLocation, destination, fare } = req.body;

  if (!req.user || req.user.role !== 'PASSENGER') {
    return res.status(403).json(errorResponse('Access denied: Only passengers can request rides'));
  }

  if (!pickupLocation || !destination || !fare) {
    return res.status(400).json(errorResponse('Pickup, destination, and fare are required'));
  }

  try {
    const newRide = await createRideRequest(req.user.id, pickupLocation, destination, parseFloat(fare));

    // Notify online drivers via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('drivers').emit('ride-requested', newRide);
    }

    return res.status(201).json(successResponse(newRide));
  } catch (err: any) {
    if (err.message === 'You already have an active ride request') {
      return res.status(400).json(errorResponse(err.message));
    }
    console.error('Request ride error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const acceptRide = async (req: AuthenticatedRequest, res: Response) => {
  const { rideId } = req.body;

  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json(errorResponse('Access denied: Only drivers can accept rides'));
  }

  if (!rideId) {
    return res.status(400).json(errorResponse('rideId is required'));
  }

  try {
    const updatedRide = await executeRideAccept(req.user.id, rideId);

    // Notify passenger and clean up driver grids via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updatedRide.passengerId}`).emit('ride-accepted', updatedRide);
      io.to('drivers').emit('ride-removed', { rideId: updatedRide.id });
    }

    return res.json(successResponse(updatedRide));
  } catch (err: any) {
    if (
      err.message === 'Driver profile not found' ||
      err.message === 'You must go online to accept rides' ||
      err.message === 'You are already handling an active ride' ||
      err.message === 'Ride not found' ||
      err.message === 'Ride already accepted or cancelled'
    ) {
      return res.status(400).json(errorResponse(err.message));
    }
    console.error('Accept ride error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const cancelRide = async (req: AuthenticatedRequest, res: Response) => {
  const { rideId } = req.body;

  if (!rideId) {
    return res.status(400).json(errorResponse('rideId is required'));
  }

  try {
    const { updatedRide, driverUserId } = await executeRideCancel(req.user!.id, req.user!.role, rideId);

    // Dispatch real-time cancellation notifications via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updatedRide.passengerId}`).emit('ride-cancelled', { rideId });
      if (driverUserId) {
        io.to(`user_${driverUserId}`).emit('ride-cancelled', { rideId });
      } else {
        io.to('drivers').emit('ride-removed', { rideId });
      }
    }

    return res.json(successResponse(updatedRide));
  } catch (err: any) {
    if (err.message === 'Ride not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    if (err.message.includes('Access denied')) {
      return res.status(403).json(errorResponse(err.message));
    }
    if (err.message === 'Ride is already closed') {
      return res.status(400).json(errorResponse(err.message));
    }
    console.error('Cancel ride error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const getActiveRide = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('Not authenticated'));
  }

  try {
    const activeRide = await fetchActiveRideInfo(req.user.id, req.user.role);
    return res.json(successResponse(activeRide));
  } catch (err: any) {
    if (err.message === 'Driver profile not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    console.error('Get active ride error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const getAvailableRides = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json(errorResponse('Access denied: Only drivers can list available rides'));
  }

  try {
    const list = await fetchAvailableRidesList();
    return res.json(successResponse(list));
  } catch (err: any) {
    console.error('Get available rides error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const progressRideStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const rideId = req.params.id;

  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json(errorResponse('Access denied: Only drivers can update ride status'));
  }

  if (status !== 'IN_PROGRESS' && status !== 'COMPLETED') {
    return res.status(400).json(errorResponse('Invalid status transition'));
  }

  try {
    const updatedRide = await updateRideStatusLifecycle(req.user.id, rideId, status);

    // Notify passenger via Socket.io
    const io = req.app.get('io');
    if (io) {
      if (status === 'IN_PROGRESS') {
        io.to(`user_${updatedRide.passengerId}`).emit('ride-started', updatedRide);
      } else if (status === 'COMPLETED') {
        io.to(`user_${updatedRide.passengerId}`).emit('ride-completed', updatedRide);
      }
    }

    return res.json(successResponse(updatedRide));
  } catch (err: any) {
    if (
      err.message === 'Driver profile not found' ||
      err.message === 'Ride not found or not assigned to you'
    ) {
      return res.status(404).json(errorResponse(err.message));
    }
    if (
      err.message === 'Ride must be accepted before starting' ||
      err.message === 'Ride must be in progress before completing'
    ) {
      return res.status(400).json(errorResponse(err.message));
    }
    console.error('Update ride status error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
