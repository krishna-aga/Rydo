import { z } from 'zod';

export const requestRideSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleType: z.enum(['E-Rickshaw', 'Golf Cart'], {
    errorMap: () => ({ message: "Vehicle type must be either 'E-Rickshaw' or 'Golf Cart'" })
  }),
  fare: z.number().optional()
});

export const acceptRideSchema = z.object({
  rideId: z.string().uuid('Invalid ride ID format')
});

export const scheduleRideSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleType: z.enum(['E-Rickshaw', 'Golf Cart'], {
    errorMap: () => ({ message: "Vehicle type must be either 'E-Rickshaw' or 'Golf Cart'" })
  }),
  fare: z.number().optional(),
  scheduledTime: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d > new Date();
  }, {
    message: 'scheduledTime must be a valid ISO date string in the future'
  })
});
