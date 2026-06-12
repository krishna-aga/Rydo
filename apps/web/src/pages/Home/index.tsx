import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useRideStore } from '../../store/useRideStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import { apiFetch } from '../../services/api.service.js';
import MainLayout from '../../layouts/MainLayout.js';
import Sidebar from '../../layouts/Sidebar.js';
import PassengerDashboard from '../PassengerDashboard/index.js';
import DriverDashboard from '../DriverDashboard/index.js';
import MapCanvas from '../../components/MapCanvas.js';
import RatingModal from '../../components/RatingModal.js';
import ToastContainer from '../../components/ToastContainer.js';
import AnalyticsDashboard from '../AnalyticsDashboard/index.js';
import AdminDashboard from '../AdminDashboard/index.js';

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

  // Connect socket on validation (skip for admin accounts)
  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') return;

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

  // Real-Time GPS Geolocation Tracking for Drivers (skip for admin / pending accounts)
  useEffect(() => {
    if (!token || user?.role !== 'DRIVER' || !driver?.isOnline || driver?.verificationStatus !== 'APPROVED') return;

    const sendLocationUpdate = async (lat: number, lng: number) => {
      try {
        await apiFetch<any>('/drivers/location', token, {
          method: 'PATCH',
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
  }, [token, user?.role, driver?.isOnline, driver?.verificationStatus]);

  if (!user) return null;

  // Render Admin Dashboard
  if (user.role === 'ADMIN') {
    return (
      <MainLayout>
        <AdminDashboard />
        <ToastContainer />
      </MainLayout>
    );
  }

  // Render Driver Verification Pending / Rejected Splash Screens
  if (user.role === 'DRIVER' && (!driver || driver.verificationStatus !== 'APPROVED')) {
    const status = driver?.verificationStatus || 'PENDING';
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            {status === 'PENDING' ? (
              <>
                <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto animate-pulse">
                  ⏳
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-200">Registration Pending</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Your driver registration has been successfully submitted and is currently awaiting administrator verification.
                  </p>
                </div>
                <div className="text-xs text-indigo-400/80 font-semibold bg-indigo-950/20 border border-indigo-900/30 rounded-xl py-2.5 px-4 inline-block">
                  Please refresh or log back in later.
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                  ❌
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-200">Registration Rejected</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Unfortunately, your registration request was rejected by the system administrator. Please contact Rydo Support for further assistance.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

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
      
      {/* Toast Notification alerts for real-time dispatch events */}
      <ToastContainer />
    </MainLayout>
  );
}
