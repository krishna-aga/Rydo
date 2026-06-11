import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateDriverStatus, updateDriverLocation, fetchOnlineDriversList } from '../services/drivers.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const toggleStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { isOnline } = req.body;

  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json(errorResponse('Access denied: Only drivers can toggle status'));
  }

  if (typeof isOnline !== 'boolean') {
    return res.status(400).json(errorResponse('isOnline boolean is required'));
  }

  try {
    const updatedDriver = await updateDriverStatus(req.user.id, isOnline);

    // Broadcast status change via Socket.io
    const io = req.app.get('io');
    if (io) {
      if (isOnline) {
        io.emit('driver-online', {
          id: updatedDriver.id,
          name: updatedDriver.user.name || 'Anonymous',
          vehicleType: updatedDriver.vehicleType,
          vehicleNumber: updatedDriver.vehicleNumber,
          rating: updatedDriver.rating,
          latitude: updatedDriver.latitude,
          longitude: updatedDriver.longitude
        });
      } else {
        io.emit('driver-offline', { id: updatedDriver.id });
      }
    }

    return res.json(successResponse({
      id: updatedDriver.id,
      userId: updatedDriver.userId,
      vehicleType: updatedDriver.vehicleType,
      vehicleNumber: updatedDriver.vehicleNumber,
      isOnline: updatedDriver.isOnline,
      verificationStatus: updatedDriver.verificationStatus,
      rating: updatedDriver.rating,
      latitude: updatedDriver.latitude,
      longitude: updatedDriver.longitude
    }));
  } catch (err: any) {
    if (err.message === 'Driver profile not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    console.error('Toggle status error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude } = req.body;

  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json(errorResponse('Access denied: Only drivers can update location'));
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json(errorResponse('latitude and longitude numbers are required'));
  }

  try {
    const updatedDriver = await updateDriverLocation(req.user.id, latitude, longitude);

    // Broadcast location update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('driver-location', {
        driverId: updatedDriver.id,
        latitude,
        longitude
      });
    }

    return res.json(successResponse({
      id: updatedDriver.id,
      latitude: updatedDriver.latitude,
      longitude: updatedDriver.longitude
    }));
  } catch (err: any) {
    if (err.message === 'Driver profile not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    console.error('Update location error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const getOnlineDrivers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await fetchOnlineDriversList();
    return res.json(successResponse(list));
  } catch (err: any) {
    console.error('Get online drivers error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
