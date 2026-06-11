import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useRideStore } from './useRideStore.js';
import { useAuthStore } from './useAuthStore.js';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  showRatingModal: boolean;
  ratingRideId: string | null;
  connectSocket: (userId: string, role: 'PASSENGER' | 'DRIVER') => void;
  disconnectSocket: () => void;
  closeRatingModal: () => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  showRatingModal: false,
  ratingRideId: null,

  connectSocket: (userId, role) => {
    if (get().socket) return;

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
    });

    socket.on('ride-started', (updatedRide) => {
      console.log('🗺️ Ride started:', updatedRide);
      useRideStore.setState({ activeRide: updatedRide });
    });

    socket.on('ride-completed', (updatedRide) => {
      console.log('🗺️ Ride completed:', updatedRide);
      // Trigger the rating feedback modal overlay
      set({ showRatingModal: true, ratingRideId: updatedRide.id });
      useRideStore.setState({ activeRide: null });
    });

    // 4. Live Cancellations (for Passenger and Driver)
    socket.on('ride-cancelled', ({ rideId }) => {
      console.log('🗺️ Ride cancelled:', rideId);
      useRideStore.setState({ activeRide: null });
      alert('Active ride was cancelled.');
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
