import { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore.js';
import { useRideStore } from './store/useRideStore.js';
import { useSocketStore } from './store/useSocketStore.js';
import AuthScreen from './components/AuthScreen.js';
import MapCanvas from './components/MapCanvas.js';
import RatingModal from './components/RatingModal.js';
import DriverStatsDashboard from './components/DriverStatsDashboard.js';
import { Button } from '@rydo/ui';

export default function App() {
  const { token, user, driver, checkMe, logout } = useAuthStore();
  const {
    activeRide,
    availableRides,
    onlineDrivers,
    fetchActiveRide,
    requestRide,
    acceptRide,
    cancelRide,
    updateDriverStatus,
    progressRideStatus,
    fetchAvailableRides,
    fetchOnlineDrivers
  } = useRideStore();

  const { connectSocket, disconnectSocket } = useSocketStore();

  const [pickup, setPickup] = useState('Main Gate');
  const [destination, setDestination] = useState('Govind Bhawan');
  const [fare, setFare] = useState(40);

  // Check authentication session
  useEffect(() => {
    checkMe();
  }, []);

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

  if (!token || !user) {
    return <AuthScreen />;
  }

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pickup === destination) {
      alert('Pickup and destination cannot be the same');
      return;
    }
    await requestRide(token, { pickupLocation: pickup, destination, fare });
  };

  const handleToggleOnline = async () => {
    if (!driver) return;
    const nextOnlineState = !driver.isOnline;
    const success = await updateDriverStatus(token, nextOnlineState);
    if (success) {
      checkMe();
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Upper Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
            RYDO
          </span>
          <span className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {user.role} Control Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-200">{user.name || 'Campus Member'}</div>
            <div className="text-xs text-slate-400">{user.email}</div>
          </div>
          <Button variant="secondary" onClick={logout} className="py-1.5 px-3.5 text-xs">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Operations Split Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Operations Panel */}
        <aside className="w-full lg:w-[450px] border-r border-slate-800 bg-slate-900/10 flex flex-col overflow-y-auto z-10 shrink-0">
          <div className="p-6 flex-1 flex flex-col gap-6">
            
            {/* Passenger Control View */}
            {user.role === 'PASSENGER' && (
              <div className="flex-1 flex flex-col gap-6">
                {!activeRide ? (
                  /* Request Panel */
                  <div className="space-y-5">
                    <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-5 space-y-4">
                      <h3 className="text-md font-bold text-slate-200">Book E-Rickshaw</h3>
                      <form onSubmit={handleRequestRide} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Pickup Landmark</label>
                          <select
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
                          >
                            <option value="Main Gate">Main Gate</option>
                            <option value="Govind Bhawan">Govind Bhawan</option>
                            <option value="Rajendra Bhawan">Rajendra Bhawan</option>
                            <option value="Ravindra Bhawan">Ravindra Bhawan</option>
                            <option value="Lecture Hall Complex">Lecture Hall Complex</option>
                            <option value="Library">Library</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Destination Landmark</label>
                          <select
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
                          >
                            <option value="Main Gate">Main Gate</option>
                            <option value="Govind Bhawan">Govind Bhawan</option>
                            <option value="Rajendra Bhawan">Rajendra Bhawan</option>
                            <option value="Ravindra Bhawan">Ravindra Bhawan</option>
                            <option value="Lecture Hall Complex">Lecture Hall Complex</option>
                            <option value="Library">Library</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase mb-2">
                            <span>Fare Estimate</span>
                            <span className="text-indigo-400">₹{fare}</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="150"
                            step="5"
                            value={fare}
                            onChange={(e) => setFare(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <Button type="submit" className="w-full py-3 mt-4">
                          Request Campus Transit
                        </Button>
                      </form>
                    </div>

                    {/* Online Drivers Count Info */}
                    <div className="border border-slate-800/80 bg-slate-950/40 rounded-2xl p-5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Drivers in service</h4>
                      <div className="space-y-2">
                        {onlineDrivers.length > 0 ? (
                          onlineDrivers.map((d: any) => (
                            <div key={d.id} className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
                              <div>
                                <span className="font-medium text-slate-200">{d.name}</span>
                                <span className="text-xs text-slate-400 block">{d.vehicleType} ({d.vehicleNumber})</span>
                              </div>
                              <span className="text-amber-400 text-xs font-bold">★ {d.rating.toFixed(1)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500 py-2">No active drivers online right now.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Active Ride Dispatch State Layout */
                  <div className="space-y-4">
                    <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Status: {activeRide.status}
                          </span>
                          <h3 className="text-lg font-bold text-slate-200 mt-2">Transit Details</h3>
                        </div>
                        <span className="text-xl font-extrabold text-indigo-400 font-mono">₹{activeRide.fare}</span>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-2 text-sm text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pickup:</span>
                          <span className="font-semibold">{activeRide.pickupLocation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Destination:</span>
                          <span className="font-semibold">{activeRide.destination}</span>
                        </div>
                      </div>

                      {activeRide.status === 'REQUESTED' && (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                          <span className="text-xs text-slate-400">Matching with nearby E-Rickshaws...</span>
                        </div>
                      )}

                      {activeRide.status !== 'REQUESTED' && activeRide.driver && (
                        <div className="border-t border-slate-800 pt-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned E-Rickshaw</h4>
                          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
                            <div>
                              <div className="font-bold text-slate-200">{activeRide.driver.user?.name || 'Assigned Driver'}</div>
                              <div className="text-xs text-slate-400">{activeRide.driver.vehicleType} • {activeRide.driver.vehicleNumber}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-amber-400 text-xs font-bold">★ {activeRide.driver.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button variant="danger" className="w-full py-2.5 mt-2" onClick={() => cancelRide(token, activeRide.id)}>
                        Cancel Transit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Driver Control View */}
            {user.role === 'DRIVER' && driver && (
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Online Offline Status toggle */}
                <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                  <div>
                    <h3 className="font-bold text-slate-200">Go Online</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle availability to accept jobs</p>
                  </div>
                  <button
                    onClick={handleToggleOnline}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                      driver.isOnline ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        driver.isOnline ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {!driver.isOnline ? (
                  /* Offline State Display Banner */
                  <div className="flex-1 border border-slate-800 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/20">
                    <span className="text-3xl">📴</span>
                    <h4 className="font-bold text-slate-300">You are Offline</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Activate online status toggles above to receive and assign client ride bookings.
                    </p>
                  </div>
                ) : !activeRide ? (
                  /* Driver Stats & Available Job Feed Split */
                  <div className="space-y-6">
                    <DriverStatsDashboard />

                    <div className="space-y-4 pt-4 border-t border-slate-800/80">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Bookings Grid</h3>
                      <div className="space-y-3">
                        {availableRides.length > 0 ? (
                          availableRides.map((ride) => (
                            <div key={ride.id} className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-semibold text-indigo-400">{ride.passenger?.name || 'Passenger'}</span>
                                  <div className="text-[10px] text-slate-500 mt-0.5">ID: {ride.id.substring(0, 8)}</div>
                                </div>
                                <span className="text-sm font-bold text-slate-200">₹{ride.fare}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-xs text-slate-300 border-t border-b border-slate-800/80 py-2.5">
                                <div>
                                  <span className="text-[10px] uppercase text-slate-500 block mb-0.5">Pickup</span>
                                  <span className="font-semibold text-slate-200">{ride.pickupLocation}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-slate-500 block mb-0.5">Destination</span>
                                  <span className="font-semibold text-slate-200">{ride.destination}</span>
                                </div>
                              </div>

                              <Button className="w-full py-2 text-xs" onClick={() => acceptRide(token, ride.id)}>
                                Accept Job Request
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 border border-slate-800/80 border-dashed rounded-xl text-slate-500 text-xs">
                            Waiting for incoming passenger ride requests...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Active Dispatch Progression Card */
                  <div className="space-y-4">
                    <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active Job: {activeRide.status}
                          </span>
                          <h3 className="text-lg font-bold text-slate-200 mt-2">Active Passenger</h3>
                        </div>
                        <span className="text-lg font-extrabold text-emerald-400 font-mono">₹{activeRide.fare}</span>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5 text-sm text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Name:</span>
                          <span className="font-semibold">{activeRide.passenger?.name || 'Campus Member'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-semibold text-xs">{activeRide.passenger?.email}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-2 text-sm text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">From:</span>
                          <span className="font-semibold">{activeRide.pickupLocation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">To:</span>
                          <span className="font-semibold">{activeRide.destination}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-2">
                        {activeRide.status === 'ACCEPTED' && (
                          <Button className="w-full py-3" onClick={() => progressRideStatus(token, activeRide.id, 'IN_PROGRESS')}>
                            Start Passenger Transit
                          </Button>
                        )}
                        {activeRide.status === 'IN_PROGRESS' && (
                          <Button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => progressRideStatus(token, activeRide.id, 'COMPLETED')}>
                            Mark Job Completed
                          </Button>
                        )}
                        <Button variant="danger" className="w-full py-2.5 mt-2" onClick={() => cancelRide(token, activeRide.id)}>
                          Cancel Ride
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

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
      </div>

      {/* Ratings Modal overlay for completed ride feedbacks */}
      <RatingModal />
    </div>
  );
}
