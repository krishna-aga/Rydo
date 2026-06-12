import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const { addToast } = useSocketStore();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDriversList = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/admin/drivers/pending', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setDrivers(data.data);
      } else {
        setError(data.error || 'Failed to fetch pending registration requests');
      }
    } catch (err) {
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversList();
  }, [token]);

  const handleVerify = async (driverId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${driverId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          `Driver application ${status === 'APPROVED' ? 'Approved' : 'Rejected'} successfully!`,
          status === 'APPROVED' ? 'success' : 'warning'
        );
        fetchDriversList();
      } else {
        addToast(data.error || 'Verification update failed', 'error');
      }
    } catch (err) {
      addToast('Network error updating verification status', 'error');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-950 p-6 md:p-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
            Verification Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and approve driver credentials before they gain access to the campus mobility dispatcher grid.
          </p>
        </div>
        <button
          onClick={fetchDriversList}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          🔄 {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 text-xs font-semibold rounded-xl p-4">
          ⚠️ {error}
        </div>
      )}

      {loading && drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs">Fetching pending registration logs...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {drivers.length > 0 ? (
            drivers.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl hover:border-slate-700/60 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-md font-bold text-slate-200">{d.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{d.email}</p>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        d.verificationStatus === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      }`}
                    >
                      {d.verificationStatus}
                    </span>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Vehicle Type</span>
                      <span className="text-slate-300 font-semibold mt-0.5 block">
                        {d.vehicleType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">License Plate</span>
                      <span className="text-slate-300 font-semibold mt-0.5 block">
                        {d.vehicleNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => handleVerify(d.id, 'REJECTED')}
                    className="py-2.5 rounded-xl border border-rose-900 hover:bg-rose-950/20 text-rose-400 font-bold text-xs transition-all focus:outline-none"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleVerify(d.id, 'APPROVED')}
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all focus:outline-none"
                  >
                    Approve Driver
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full border border-dashed border-slate-800 rounded-2xl py-16 text-center text-slate-500 space-y-2">
              <span className="text-3xl block">📋</span>
              <p className="text-xs font-semibold text-slate-400">Queue Clear</p>
              <p className="text-[10px] text-slate-500">No driver registrations are currently awaiting verification.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
