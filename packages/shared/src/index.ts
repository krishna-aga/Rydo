export type Role = 'PASSENGER' | 'DRIVER';
export type RideStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleNumber: string;
  isOnline: boolean;
  verificationStatus: VerificationStatus;
  rating: number;
  latitude?: number;
  longitude?: number;
  user?: User;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  pickupLocation: string;
  destination: string;
  status: RideStatus;
  fare: number;
  createdAt: string;
  passenger?: User;
  driver?: Driver;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
