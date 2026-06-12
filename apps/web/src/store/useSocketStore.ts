import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useRideStore } from './useRideStore.js';
import { useAuthStore } from './useAuthStore.js';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  showRatingModal: boolean;
  ratingRideId: string | null;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  connectSocket: (userId: string, role: 'PASSENGER' | 'DRIVER') => void;
  disconnectSocket: () => void;
  closeRatingModal: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const triggerBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch (err) {
      console.warn('Failed to trigger native browser notification:', err);
    }
  }
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  showRatingModal: false,
  ratingRideId: null,
  toasts: [],

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 6000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  connectSocket: (userId, role) => {
    if (get().socket) return;

    // Request Notification permission if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socket = io(SOCKET_URL, {
      query: { userId, role }
    });

    socket.on('connect', () => {
      set({ connected: true });
      console.log('🔌 Connected to Socket.io server');
    });

    socket.on('disconnect', () => {
      set({ connected: false });
      console.log('🔌 Disconnected from Socket.io server');
    });

    // Real-Time Events Configuration
    
    // 1. Driver Availability Broadcasts (for Passengers)
    socket.on('driver-online', (driverInfo) => {
      console.log('🚗 Driver went online:', driverInfo);
      useRideStore.setState((state) => ({
        onlineDrivers: [...state.onlineDrivers.filter(d => d.id !== driverInfo.id), driverInfo]
      }));
    });

    socket.on('driver-offline', ({ id }) => {
      console.log('🚗 Driver went offline:', id);
      useRideStore.setState((state) => ({
        onlineDrivers: state.onlineDrivers.filter(d => d.id !== id)
      }));
    });

    socket.on('driver-location', ({ driverId, latitude, longitude }) => {
      console.log('🚗 Driver location update:', driverId, latitude, longitude);
      useRideStore.setState((state) => {
        const updatedOnlineDrivers = state.onlineDrivers.map((d) => {
          if (d.id === driverId) {
            return { ...d, latitude, longitude };
          }
          return d;
        });

        let updatedActiveRide = state.activeRide;
        if (state.activeRide && state.activeRide.driver && state.activeRide.driver.id === driverId) {
          updatedActiveRide = {
            ...state.activeRide,
            driver: {
              ...state.activeRide.driver,
              latitude,
              longitude
            }
          };
        }

        return {
          onlineDrivers: updatedOnlineDrivers,
          activeRide: updatedActiveRide
        };
      });

      // Also update the driver coordinates in the auth store if it represents ourselves
      const authState = useAuthStore.getState();
      if (authState.driver && authState.driver.id === driverId) {
        useAuthStore.setState({
          driver: {
            ...authState.driver,
            latitude,
            longitude
          }
        });
      }
    });

    // 2. Booking Requests Dispatch (for Drivers)
    socket.on('ride-requested', (newRide) => {
      console.log('🗺️ Incoming booking request:', newRide);
      useRideStore.setState((state) => ({
        availableRides: [newRide, ...state.availableRides]
      }));

      const msg = `🗺️ New booking request: ${newRide.pickupLocation} ➔ ${newRide.destination} (Fare: ₹${newRide.fare})`;
      get().addToast(msg, 'info');
      triggerBrowserNotification('New Ride Request! 🗺️', `From ${newRide.pickupLocation} to ${newRide.destination} for ₹${newRide.fare}.`);
    });

    socket.on('ride-removed', ({ rideId }) => {
      console.log('🗺️ Booking request accepted elsewhere/cancelled:', rideId);
      useRideStore.setState((state) => ({
        availableRides: state.availableRides.filter(r => r.id !== rideId)
      }));
    });

    // 3. Passenger Live Updates (for Passenger)
    socket.on('ride-accepted', (updatedRide) => {
      console.log('🗺️ Ride booking accepted:', updatedRide);
      useRideStore.setState({ activeRide: updatedRide });

      const driverName = updatedRide.driver?.user?.name || 'A campus driver';
      const msg = `🎉 Your ride request has been accepted by driver: ${driverName}!`;
      get().addToast(msg, 'success');
      triggerBrowserNotification('Ride Accepted! 🎉', `Driver ${driverName} is on the way to pick you up.`);
    });

    socket.on('ride-started', (updatedRide) => {
      console.log('🗺️ Ride started:', updatedRide);
      useRideStore.setState({ activeRide: updatedRide });

      const msg = `🚗 Your ride has started! Heading to ${updatedRide.destination}.`;
      get().addToast(msg, 'info');
      triggerBrowserNotification('Ride Started! 🚗', `En route to ${updatedRide.destination}.`);
    });

    socket.on('ride-completed', (updatedRide) => {
      console.log('🗺️ Ride completed:', updatedRide);
      // Trigger the rating feedback modal overlay
      set({ showRatingModal: true, ratingRideId: updatedRide.id });
      useRideStore.setState({ activeRide: null });

      const msg = `🏁 You have reached your destination: ${updatedRide.destination}. Please leave a rating!`;
      get().addToast(msg, 'success');
      triggerBrowserNotification('Ride Completed! 🏁', `Thank you for riding with Rydo.`);
    });

    // 4. Live Cancellations (for Passenger and Driver)
    socket.on('ride-cancelled', ({ rideId }) => {
      console.log('🗺️ Ride cancelled:', rideId);
      useRideStore.setState({ activeRide: null });

      const msg = `⚠️ Active ride has been cancelled.`;
      get().addToast(msg, 'warning');
      triggerBrowserNotification('Ride Cancelled ⚠️', `The active ride booking has been cancelled.`);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  closeRatingModal: () => set({ showRatingModal: false, ratingRideId: null })
}));
