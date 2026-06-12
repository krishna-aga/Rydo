import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useRideStore } from '../store/useRideStore.js';
import { Button } from '@rydo/ui';

export default function SchedulingPanel() {
  const { token } = useAuthStore();
  const {
    scheduledRides,
    scheduleNewRide,
    fetchUpcomingScheduledRides,
    cancelScheduledRide,
    selectingOnMap,
    tempPickup,
    tempDestination,
    setSelectingOnMap,
    setTempPickup,
    setTempDestination
  } = useRideStore();

  const [pickup, setPickup] = useState('Main Gate');
  const [destination, setDestination] = useState('Govind Bhawan');
  const [vehicleType, setVehicleType] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (token) {
      fetchUpcomingScheduledRides(token);
    }
  }, [token]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrMsg('');

    if (pickup === destination) {
      setErrMsg('Pickup and destination cannot be the same');
      return;
    }

    if (!vehicleType) {
      setErrMsg('Please select a vehicle type');
      return;
    }

    if (!dateTime) {
      setErrMsg('Please select a date and time for your ride');
      return;
    }

    const scheduledDate = new Date(dateTime);
    if (scheduledDate <= new Date()) {
      setErrMsg('Scheduled time must be in the future');
      return;
    }

    setBooking(true);
    const success = await scheduleNewRide(token!, {
      pickupLocation: pickup,
      destination,
      vehicleType,
      scheduledTime: scheduledDate.toISOString()
    });

    setBooking(false);
    if (success) {
      setSuccessMsg('Ride scheduled successfully!');
      setDateTime('');
    } else {
      setErrMsg('Failed to schedule ride. Try again.');
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this scheduled ride?')) {
      await cancelScheduledRide(token!, id);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setPickup('📍 Loading GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = `Current Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
        setPickup(locationName);
      },
      (error) => {
        console.error('GPS tracking failed:', error);
        alert('Could not access your location. Please check browser permissions.');
        setPickup('Main Gate');
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

  const handlePickupChange = (val: string) => {
    if (val === 'GPS') {
      handleUseCurrentLocation();
    } else if (val === 'MAP') {
      triggerMapSelection('pickup');
    } else {
      setPickup(val);
      if (selectingOnMap === 'pickup') {
        setSelectingOnMap(null);
      }
    }
  };

  const handleDestinationChange = (val: string) => {
    if (val === 'MAP') {
      triggerMapSelection('destination');
    } else {
      setDestination(val);
      if (selectingOnMap === 'destination') {
        setSelectingOnMap(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Scheduling form */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-5 space-y-4">
        <h3 className="text-md font-bold text-slate-200">Schedule Future Transit</h3>
        
        {successMsg && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 rounded-xl p-3 text-xs font-semibold">
            ✅ {successMsg}
          </div>
        )}

        {errMsg && (
          <div className="bg-rose-950/30 border border-rose-900/50 text-rose-300 rounded-xl p-3 text-xs font-semibold">
            ⚠️ {errMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Pickup Landmark</label>
            <select
              value={selectingOnMap === 'pickup' ? 'MAP' : pickup}
              onChange={(e) => handlePickupChange(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
            >
              <option value="Main Gate">Main Gate</option>
              <option value="Govind Bhawan">Govind Bhawan</option>
              <option value="Rajendra Bhawan">Rajendra Bhawan</option>
              <option value="Ravindra Bhawan">Ravindra Bhawan</option>
              <option value="Lecture Hall Complex">Lecture Hall Complex</option>
              <option value="Library">Library</option>
              
              <option disabled>──────────</option>
              <option value="GPS">📍 Current Location (GPS)</option>
              <option value="MAP">{selectingOnMap === 'pickup' ? '🗺️ Selecting on Map...' : '🗺️ Select location on Map'}</option>

              {pickup && !['Main Gate', 'Govind Bhawan', 'Rajendra Bhawan', 'Ravindra Bhawan', 'Lecture Hall Complex', 'Library', 'GPS', 'MAP'].includes(pickup) && (
                <option value={pickup}>{pickup}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Destination Landmark</label>
            <select
              value={selectingOnMap === 'destination' ? 'MAP' : destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
            >
              <option value="Main Gate">Main Gate</option>
              <option value="Govind Bhawan">Govind Bhawan</option>
              <option value="Rajendra Bhawan">Rajendra Bhawan</option>
              <option value="Ravindra Bhawan">Ravindra Bhawan</option>
              <option value="Lecture Hall Complex">Lecture Hall Complex</option>
              <option value="Library">Library</option>
              
              <option disabled>──────────</option>
              <option value="MAP">{selectingOnMap === 'destination' ? '🗺️ Selecting on Map...' : '🗺️ Select location on Map'}</option>

              {destination && !['Main Gate', 'Govind Bhawan', 'Rajendra Bhawan', 'Ravindra Bhawan', 'Lecture Hall Complex', 'Library', 'MAP'].includes(destination) && (
                <option value={destination}>{destination}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
            />
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

          <Button type="submit" disabled={booking} className="w-full py-3 mt-4">
            {booking ? 'Scheduling...' : 'Reserve Ride'}
          </Button>
        </form>
      </div>

      {/* Upcoming Reservation list */}
      <div className="border border-slate-800/80 bg-slate-950/40 rounded-2xl p-5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Upcoming Reservations</h4>
        <div className="space-y-3">
          {scheduledRides.length > 0 ? (
            scheduledRides.map((ride: any) => {
              const formattedTime = new Date(ride.scheduledTime).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={ride.id} className="border border-slate-900 bg-slate-950/60 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      Pending
                    </span>
                    <span className="text-sm font-extrabold text-indigo-400 font-mono">₹{ride.fare}</span>
                  </div>
                  
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-500">Route: </span>
                      <span className="font-semibold text-slate-200">{ride.pickupLocation} ➔ {ride.destination}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Vehicle: </span>
                      <span className="font-semibold text-slate-200">{ride.vehicleType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Due: </span>
                      <span className="font-semibold text-slate-200">{formattedTime}</span>
                    </div>
                  </div>

                  <Button variant="danger" className="w-full py-1.5 text-xs" onClick={() => handleCancel(ride.id)}>
                    Cancel Reservation
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">No upcoming scheduled transits.</div>
          )}
        </div>
      </div>
    </div>
  );
}
