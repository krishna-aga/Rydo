import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useRideStore } from '../../store/useRideStore.js';
import { apiService } from '../../services/api.service.js';
import { Button } from '@rydo/ui';

interface DashboardStats {
  stats: {
    totalRides: number;
    activeRides: number;
    earnings: number;
    rating: number;
  };
  chartData: { day: string; earnings: number }[];
  recentRides: {
    id: string;
    passengerName: string;
    pickupLocation: string;
    destination: string;
    status: string;
    fare: number;
    createdAt: string;
  }[];
}

export default function DriverDashboard() {
  const { token, driver, checkMe } = useAuthStore();
  const {
    activeRide,
    availableRides,
    updateDriverStatus,
    acceptRide,
    progressRideStatus,
    cancelRide
  } = useRideStore();

  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const result = await apiService.getDashboardStats(token);
      if (result.success && result.data) {
        setStatsData(result.data);
      }
    } catch (err) {
      console.error('Error fetching driver dashboard stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [token]);

  const handleToggleOnline = async () => {
    if (!driver) return;
    const nextOnlineState = !driver.isOnline;
    const success = await updateDriverStatus(token!, nextOnlineState);
    if (success) {
      checkMe();
    }
  };

  return (
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
            driver?.isOnline ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              driver?.isOnline ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!driver?.isOnline ? (
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
          {/* Stats section */}
          {statsLoading ? (
            <div className="flex items-center justify-center py-16 text-xs text-slate-500">
              Loading dashboard metrics...
            </div>
          ) : statsData ? (
            <div className="space-y-6">
              {/* Metrics Grid Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed Jobs</span>
                  <span className="text-2xl font-extrabold text-slate-200 mt-2">{statsData.stats.totalRides}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Jobs</span>
                  <span className="text-2xl font-extrabold text-slate-200 mt-2">{statsData.stats.activeRides}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gross Earnings</span>
                  <span className="text-2xl font-extrabold text-indigo-400 mt-2 font-mono">₹{statsData.stats.earnings}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Driver Rating</span>
                  <span className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">★ {statsData.stats.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekly Earnings Graph</h3>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}
                        itemStyle={{ fontSize: '12px', color: '#6366f1' }}
                      />
                      <Area type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarnings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}

          {/* Available Jobs list */}
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

                    <Button className="w-full py-2 text-xs" onClick={() => acceptRide(token!, ride.id)}>
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

          {/* History table */}
          {statsData && statsData.recentRides && (
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Ride Logs</h3>
              <div className="space-y-2.5 overflow-hidden">
                {statsData.recentRides.length > 0 ? (
                  statsData.recentRides.map((ride) => (
                    <div key={ride.id} className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-2">
                      <div>
                        <div className="font-semibold text-slate-200">{ride.passengerName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {ride.pickupLocation} ➔ {ride.destination}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-slate-300">₹{ride.fare}</span>
                        <span className={`block text-[9px] uppercase font-bold mt-0.5 ${
                          ride.status === 'COMPLETED' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {ride.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No recent ride logs available.
                  </div>
                )}
              </div>
            </div>
          )}
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
                <Button className="w-full py-3" onClick={() => progressRideStatus(token!, activeRide.id, 'IN_PROGRESS')}>
                  Start Passenger Transit
                </Button>
              )}
              {activeRide.status === 'IN_PROGRESS' && (
                <Button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => progressRideStatus(token!, activeRide.id, 'COMPLETED')}>
                  Mark Job Completed
                </Button>
              )}
              <Button variant="danger" className="w-full py-2.5 mt-2" onClick={() => cancelRide(token!, activeRide.id)}>
                Cancel Ride
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
