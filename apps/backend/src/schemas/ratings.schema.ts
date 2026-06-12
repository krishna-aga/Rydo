import { z } from 'zod';

export const createRatingSchema = z.object({
  rideId: z.string().uuid('Invalid ride ID format'),
  stars: z.number().int().min(1, 'Stars must be at least 1').max(5, 'Stars cannot exceed 5'),
  feedback: z.string().optional()
});
