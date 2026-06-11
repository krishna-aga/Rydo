import { Ride, ApiResponse } from '@rydo/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiFetch = async <T>(endpoint: string, token?: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers
    }
  });

  return res.json();
};

export const apiService = {
  // Auth endpoints
  login: (credentials: any) => apiFetch<any>('/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  signup: (userData: any) => apiFetch<any>('/auth/signup', undefined, {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getMe: (token: string) => apiFetch<any>('/auth/me', token),

  // Ride endpoints
  getActiveRide: (token: string) => apiFetch<Ride>('/rides/active', token),
  requestRide: (token: string, payload: { pickupLocation: string; destination: string; fare: number }) => 
    apiFetch<Ride>('/rides/request', token, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  acceptRide: (token: string, rideId: string) => 
    apiFetch<Ride>('/rides/accept', token, {
      method: 'POST',
      body: JSON.stringify({ rideId })
    }),
  cancelRide: (token: string, rideId: string) => 
    apiFetch<any>('/rides/cancel', token, {
      method: 'POST',
      body: JSON.stringify({ rideId })
    }),
  progressRideStatus: (token: string, rideId: string, status: 'IN_PROGRESS' | 'COMPLETED') => 
    apiFetch<Ride>(`/rides/${rideId}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  getAvailableRides: (token: string) => apiFetch<Ride[]>('/rides/available', token),

  // Driver endpoints
  updateDriverStatus: (token: string, isOnline: boolean) => 
    apiFetch<any>('/drivers/status', token, {
      method: 'PATCH',
      body: JSON.stringify({ isOnline })
    }),
  getOnlineDrivers: (token: string) => apiFetch<any[]>('/drivers/online', token)
};
