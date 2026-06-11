import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useRideStore } from '../../store/useRideStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import MainLayout from '../../layouts/MainLayout.js';
import Sidebar from '../../layouts/Sidebar.js';
import PassengerDashboard from '../PassengerDashboard/index.js';
import DriverDashboard from '../DriverDashboard/index.js';
import MapCanvas from '../../components/MapCanvas.js';
import RatingModal from '../../components/RatingModal.js';
import AnalyticsDashboard from '../AnalyticsDashboard/index.js';

export default function Home() {
  const { token, user, driver, activeTab } = useAuthStore();
  const {
    activeRide,
    onlineDrivers,
    fetchActiveRide,
    fetchAvailableRides,
    fetchOnlineDrivers
  } = useRideStore();

  const { connectSocket, disconnectSocket } = useSocketStore();

  // Connect socket on validation
  useEffect(() => {
    if (token && user) {
      connectSocket(user.id, user.role);
      
      // Pull initial state
      fetchActiveRide(token);
      if (user.role === 'PASSENGER') {
        fetchOnlineDrivers(token);
      } else if (user.role === 'DRIVER') {
        fetchAvailableRides(token);
      }
    }
    return () => {
      disconnectSocket();
    };
  }, [token, user?.id]);

  // Sync available listings when driver changes online status
  useEffect(() => {
    if (token && user?.role === 'DRIVER' && driver?.isOnline) {
      fetchAvailableRides(token);
    }
  }, [token, driver?.isOnline]);

  // Real-Time GPS Geolocation Tracking for Drivers
  useEffect(() => {
    if (!token || user?.role !== 'DRIVER' || !driver?.isOnline) return;

    const sendLocationUpdate = async (lat: number, lng: number) => {
      try {
        await fetch('http://localhost:5000/api/drivers/location', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ latitude: lat, longitude: lng })
        });
      } catch (err) {
        console.error('Failed to send location update:', err);
      }
    };

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    // Start watching physical position updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Live geolocation update:', latitude, longitude);
        sendLocationUpdate(latitude, longitude);
      },
      (error) => {
        console.error('Error getting live geolocation:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [token, user?.role, driver?.isOnline]);

  if (!user) return null;

  return (
    <MainLayout>
      {activeTab === 'operations' ? (
        <>
          {/* Sidebar containing dashboard controls */}
          <Sidebar>
            {user.role === 'PASSENGER' ? (
              <PassengerDashboard />
            ) : (
              <DriverDashboard />
            )}
          </Sidebar>

          {/* Spatial Canvas (Central Map view) */}
          <main className="flex-1 h-full p-6 bg-slate-950 relative z-0">
            <MapCanvas
              pickupLocation={activeRide?.pickupLocation}
              destination={activeRide?.destination}
              onlineDrivers={
                user.role === 'DRIVER' && driver && driver.isOnline
                  ? [
                      ...onlineDrivers.filter((d) => d.id !== driver.id),
                      {
                        id: driver.id,
                        name: user.name || 'You',
                        vehicleType: driver.vehicleType,
                        vehicleNumber: driver.vehicleNumber,
                        rating: driver.rating,
                        latitude: driver.latitude,
                        longitude: driver.longitude
                      }
                    ]
                  : onlineDrivers
              }
              assignedDriverId={activeRide?.driverId || undefined}
            />
          </main>

          {/* Ratings Modal overlay for completed ride feedbacks */}
          <RatingModal />
        </>
      ) : (
        <AnalyticsDashboard />
      )}
    </MainLayout>
  );
}
