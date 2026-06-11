import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/useAuthStore.js';

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

export default function DriverStatsDashboard() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/drivers/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching driver dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 6 seconds to stay dynamic
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-xs text-slate-500">
        Loading dashboard metrics...
      </div>
    );
  }

  if (!data) return null;

  const { stats, chartData, recentRides } = data;

  return (
    <div className="space-y-6">
      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed Jobs</span>
          <span className="text-2xl font-extrabold text-slate-200 mt-2">{stats.totalRides}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Jobs</span>
          <span className="text-2xl font-extrabold text-slate-200 mt-2">{stats.activeRides}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gross Earnings</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-2 font-mono">₹{stats.earnings}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Driver Rating</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">★ {stats.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekly Earnings Graph</h3>
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* History table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Ride Logs</h3>
        <div className="space-y-2.5 overflow-hidden">
          {recentRides.length > 0 ? (
            recentRides.map((ride) => (
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
    </div>
  );
}
