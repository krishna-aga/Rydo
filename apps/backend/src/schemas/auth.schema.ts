import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['PASSENGER', 'DRIVER'], {
    errorMap: () => ({ message: "Role must be either 'PASSENGER' or 'DRIVER'" })
  }),
  vehicleType: z.enum(['E-Rickshaw', 'Golf Cart'], {
    errorMap: () => ({ message: "Vehicle type must be either 'E-Rickshaw' or 'Golf Cart'" })
  }).optional(),
  vehicleNumber: z.string().optional()
}).refine((data) => {
  if (data.role === 'DRIVER') {
    return !!data.vehicleType && !!data.vehicleNumber;
  }
  return true;
}, {
  message: 'vehicleType and vehicleNumber are required for driver registration',
  path: ['role']
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});
