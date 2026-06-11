import { create } from 'zustand';
import { Ride } from '@rydo/shared';
import { apiService } from '../services/api.service.js';

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

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  availableRides: [],
  onlineDrivers: [],
  loading: false,
  error: null,

  fetchActiveRide: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await apiService.getActiveRide(token);
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
      const data = await apiService.requestRide(token, payload);
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
      const data = await apiService.acceptRide(token, rideId);
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
      const data = await apiService.cancelRide(token, rideId);
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
      const data = await apiService.updateDriverStatus(token, isOnline);
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
      const data = await apiService.progressRideStatus(token, rideId, status);
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
      const data = await apiService.getAvailableRides(token);
      if (data.success && data.data) {
        set({ availableRides: data.data });
      }
    } catch (err) {
      console.error('Fetch available rides error', err);
    }
  },

  fetchOnlineDrivers: async (token) => {
    try {
      const data = await apiService.getOnlineDrivers(token);
      if (data.success && data.data) {
        set({ onlineDrivers: data.data });
      }
    } catch (err) {
      console.error('Fetch online drivers error', err);
    }
  }
}));
