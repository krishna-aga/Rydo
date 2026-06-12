import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { fetchPendingDrivers, verifyDriverProfile } from '../services/admin.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getPendingDrivers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await fetchPendingDrivers();
    return res.json(successResponse(list));
  } catch (err: any) {
    console.error('Fetch pending drivers error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};

export const verifyDriver = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json(errorResponse('status must be either APPROVED or REJECTED'));
  }

  try {
    const updated = await verifyDriverProfile(id, status);

    // Notify the driver in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updated.userId}`).emit('driver-verification-updated', {
        verificationStatus: updated.verificationStatus
      });
    }

    return res.json(successResponse({
      id: updated.id,
      name: updated.user.name,
      verificationStatus: updated.verificationStatus
    }));
  } catch (err: any) {
    if (err.message === 'Driver profile not found') {
      return res.status(404).json(errorResponse(err.message));
    }
    console.error('Verify driver error:', err);
    return res.status(500).json(errorResponse('Internal server error'));
  }
};
