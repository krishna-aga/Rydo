import { create } from 'zustand';
import { Ride, ApiResponse } from '@rydo/shared';

interface RideState {
  activeRide: Ride | null;
  availableRides: Ride[];
  onlineDrivers: any[];
  loading: boolean;
  error: string | null;
  fetchActiveRide: (token: string) => Promise<void>;
  requestRide: (token: string, payload: { pickupLocation: string; destination: string; fare: number }) => Promise<boolean>;
  acceptRide: (token: string, rideId: string) => Promise<boolean>;
  cancelRide: (token: string, rideId: string) => Promise<boolean>;
  updateDriverStatus: (token: string, isOnline: boolean) => Promise<boolean>;
  progressRideStatus: (token: string, rideId: string, status: 'IN_PROGRESS' | 'COMPLETED') => Promise<boolean>;
  fetchAvailableRides: (token: string) => Promise<void>;
  fetchOnlineDrivers: (token: string) => Promise<void>;
}

const API_URL = 'http://localhost:5000/api';

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  availableRides: [],
  onlineDrivers: [],
  loading: false,
  error: null,

  fetchActiveRide: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/rides/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: ApiResponse<Ride> = await res.json();
      if (data.success) {
        set({ activeRide: data.data || null, loading: false });
      } else {
        set({ error: data.error || 'Failed to fetch active ride', loading: false });
      }
    } catch (err) {
      set({ error: 'Server connection failed', loading: false });
    }
  },

  requestRide: async (token, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data: ApiResponse<Ride> = await res.json();
      if (data.success && data.data) {
        set({ activeRide: data.data, loading: false });
        return true;
      } else {
        set({ error: data.error || 'Failed to request ride', loading: false });
        return false;
      }
    } catch (err) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  acceptRide: async (token, rideId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/rides/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rideId })
      });
      const data: ApiResponse<Ride> = await res.json();
      if (data.success && data.data) {
        set({ activeRide: data.data, loading: false });
        set(state => ({
          availableRides: state.availableRides.filter(r => r.id !== rideId)
        }));
        return true;
      } else {
        set({ error: data.error || 'Failed to accept ride', loading: false });
        return false;
      }
    } catch (err) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  cancelRide: async (token, rideId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/rides/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rideId })
      });
      const data: ApiResponse<Ride> = await res.json();
      if (data.success) {
        set({ activeRide: null, loading: false });
        return true;
      } else {
        set({ error: data.error || 'Failed to cancel ride', loading: false });
        return false;
      }
    } catch (err) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  updateDriverStatus: async (token, isOnline) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/drivers/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isOnline })
      });
      const data: ApiResponse<any> = await res.json();
      if (data.success) {
        set({ loading: false });
        return true;
      } else {
        set({ error: data.error || 'Failed to update status', loading: false });
        return false;
      }
    } catch (err) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  progressRideStatus: async (token, rideId, status) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data: ApiResponse<Ride> = await res.json();
      if (data.success && data.data) {
        if (status === 'COMPLETED') {
          set({ activeRide: null, loading: false });
        } else {
          set({ activeRide: data.data, loading: false });
        }
        return true;
      } else {
        set({ error: data.error || 'Failed to progress ride', loading: false });
        return false;
      }
    } catch (err) {
      set({ error: 'Server connection failed', loading: false });
      return false;
    }
  },

  fetchAvailableRides: async (token) => {
    try {
      const res = await fetch(`${API_URL}/rides/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: ApiResponse<Ride[]> = await res.json();
      if (data.success && data.data) {
        set({ availableRides: data.data });
      }
    } catch (err) {
      console.error('Fetch available rides error', err);
    }
  },

  fetchOnlineDrivers: async (token) => {
    try {
      const res = await fetch(`${API_URL}/drivers/online`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: ApiResponse<any[]> = await res.json();
      if (data.success && data.data) {
        set({ onlineDrivers: data.data });
      }
    } catch (err) {
      console.error('Fetch online drivers error', err);
    }
  }
}));
