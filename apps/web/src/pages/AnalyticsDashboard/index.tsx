import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../store/useAuthStore.js';
import { apiService } from '../../services/api.service.js';

interface AnalyticsData {
  overallStats: {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    totalRevenue: number;
    averageFare: number;
  };
  dailyRides: { day: string; date: string; count: number; revenue: number }[];
  peakHours: { hour: string; count: number }[];
  popularPickupPoints: { location: string; count: number }[];
}

export default function AnalyticsDashboard() {
  const { token } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await apiService.getAnalytics(token);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError('Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-950 p-6">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wider uppercase">Loading analytics insights...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-950 p-6">
        <span className="text-4xl">⚠️</span>
        <span className="text-sm font-semibold text-rose-400">{error || 'No analytics data available'}</span>
        <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs text-indigo-400 transition-colors">
          Retry Sync
        </button>
      </div>
    );
  }

  const { overallStats, dailyRides, peakHours, popularPickupPoints } = data;
  const completionRate = overallStats.totalRides > 0 
    ? ((overallStats.completedRides / overallStats.totalRides) * 100).toFixed(0) 
    : '0';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 px-8 py-6 space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
          Campus Demand Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">Real-time statistics, peak hour tracking, and location density grid logs.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Bookings</span>
          <span className="text-2xl font-black text-slate-200 mt-2 font-mono">{overallStats.totalRides}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Transits</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 font-mono">{overallStats.completedRides}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Rate</span>
          <span className="text-2xl font-black text-indigo-400 mt-2 font-mono">{completionRate}%</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Revenue</span>
          <span className="text-2xl font-black text-amber-400 mt-2 font-mono">₹{overallStats.totalRevenue}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Fare</span>
          <span className="text-2xl font-black text-rose-400 mt-2 font-mono">₹{overallStats.averageFare}</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily volume and revenue */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">7-Day Transit Frequency & Revenue</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRides} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}
                />
                <Area name="Rides" type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                <Area name="Revenue (₹)" type="monotone" dataKey="revenue" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours distribution */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Hourly Peak Demand Distribution</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar name="Requests" dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Popular locations grid */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl max-w-xl">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Top Pickup Hotspots</h3>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={popularPickupPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis type="category" dataKey="location" stroke="#64748b" fontSize={10} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}
                itemStyle={{ color: '#ec4899' }}
              />
              <Bar name="Requests" dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
