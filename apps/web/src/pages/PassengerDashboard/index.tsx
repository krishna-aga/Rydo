import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useRideStore } from '../../store/useRideStore.js';
import { Button } from '@rydo/ui';
import SchedulingPanel from '../../components/SchedulingPanel.js';

export default function PassengerDashboard() {
  const { token } = useAuthStore();
  const {
    activeRide,
    onlineDrivers,
    requestRide,
    cancelRide,
    selectingOnMap,
    tempPickup,
    tempDestination,
    setSelectingOnMap,
    setTempPickup,
    setTempDestination
  } = useRideStore();

  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [pickup, setPickup] = useState('Main Gate');
  const [destination, setDestination] = useState('Govind Bhawan');
  const [vehicleType, setVehicleType] = useState('E-Rickshaw');

  // Synchronize location selections from map-clicking state
  useEffect(() => {
    if (tempPickup) {
      setPickup(tempPickup);
      setTempPickup(null);
    }
  }, [tempPickup, setTempPickup]);

  useEffect(() => {
    if (tempDestination) {
      setDestination(tempDestination);
      setTempDestination(null);
    }
  }, [tempDestination, setTempDestination]);

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pickup === destination) {
      alert('Pickup and destination cannot be the same');
      return;
    }
    await requestRide(token!, { pickupLocation: pickup, destination, vehicleType });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = `Current Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
        setPickup(locationName);
      },
      (error) => {
        console.error('GPS tracking failed:', error);
        alert('Could not access your location. Please check browser permissions.');
      }
    );
  };

  const triggerMapSelection = (type: 'pickup' | 'destination') => {
    if (selectingOnMap === type) {
      setSelectingOnMap(null);
    } else {
      setSelectingOnMap(type);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {!activeRide ? (
        <div className="space-y-5">
          {/* Segmented Mode Picker */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('now')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'now' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Book Now
            </button>
            <button
              onClick={() => setMode('schedule')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'schedule' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Schedule Ride
            </button>
          </div>

          {mode === 'now' ? (
            /* Request Panel */
            <div className="space-y-5">
              <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-md font-bold text-slate-200">Book E-Rickshaw</h3>
                <form onSubmit={handleRequestRide} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Pickup Landmark</label>
                    <div className="flex gap-2">
                      <select
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
                      >
                        <option value="Main Gate">Main Gate</option>
                        <option value="Govind Bhawan">Govind Bhawan</option>
                        <option value="Rajendra Bhawan">Rajendra Bhawan</option>
                        <option value="Ravindra Bhawan">Ravindra Bhawan</option>
                        <option value="Lecture Hall Complex">Lecture Hall Complex</option>
                        <option value="Library">Library</option>
                        
                        {pickup && !['Main Gate', 'Govind Bhawan', 'Rajendra Bhawan', 'Ravindra Bhawan', 'Lecture Hall Complex', 'Library'].includes(pickup) && (
                          <option value={pickup}>{pickup}</option>
                        )}
                      </select>
                      
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        title="Use Current GPS Location"
                        className="px-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-semibold flex items-center justify-center transition-colors focus:outline-none"
                      >
                        📍 GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerMapSelection('pickup')}
                        title="Choose Coordinates on Map"
                        className={`px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors focus:outline-none ${
                          selectingOnMap === 'pickup'
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        🗺️ Map
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Destination Landmark</label>
                    <div className="flex gap-2">
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
                      >
                        <option value="Main Gate">Main Gate</option>
                        <option value="Govind Bhawan">Govind Bhawan</option>
                        <option value="Rajendra Bhawan">Rajendra Bhawan</option>
                        <option value="Ravindra Bhawan">Ravindra Bhawan</option>
                        <option value="Lecture Hall Complex">Lecture Hall Complex</option>
                        <option value="Library">Library</option>

                        {destination && !['Main Gate', 'Govind Bhawan', 'Rajendra Bhawan', 'Ravindra Bhawan', 'Lecture Hall Complex', 'Library'].includes(destination) && (
                          <option value={destination}>{destination}</option>
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => triggerMapSelection('destination')}
                        title="Choose Coordinates on Map"
                        className={`px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors focus:outline-none ${
                          selectingOnMap === 'destination'
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        🗺️ Map
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Select Vehicle Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVehicleType('E-Rickshaw')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 ${
                          vehicleType === 'E-Rickshaw'
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-inner'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-lg">🛺</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">E-Rickshaw</span>
                          <span className="text-xs font-extrabold font-mono mt-0.5 text-indigo-400">₹10</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType('Golf Cart')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 ${
                          vehicleType === 'Golf Cart'
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-inner'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-lg">🚐</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">Golf Cart</span>
                          <span className="text-xs font-extrabold font-mono mt-0.5 text-indigo-400">₹8</span>
                        </div>
                      </button>
                    </div>
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
            <SchedulingPanel />
          )}
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
                <span className="text-xs text-slate-400">Matching with nearby {activeRide.vehicleType}s...</span>
              </div>
            )}

            {activeRide.status !== 'REQUESTED' && activeRide.driver && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned {activeRide.vehicleType}</h4>
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

            <Button variant="danger" className="w-full py-2.5 mt-2" onClick={() => cancelRide(token!, activeRide.id)}>
              Cancel Transit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
