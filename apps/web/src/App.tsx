import { useState, useEffect } from 'react';
import { Button } from '@rydo/ui';
import { User, ApiResponse } from '@rydo/shared';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sample/mock users or fetch from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (!response.ok) {
        throw new Error('Could not connect to backend server');
      }
      const result: ApiResponse<User[]> = await response.json();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err: any) {
      // Fallback mock data when backend is not running or env database is not set
      console.warn("Backend connection failed, loading mock data", err);
      setUsers([
        {
          id: '1',
          name: 'Jane Doe',
          email: 'jane@rydo.app',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'John Smith',
          email: 'john@rydo.app',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setError('Using local mock data (Express backend offline or DATABASE_URL not configured).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
              Rydo Workspace
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Turborepo Monorepo Demo (Vite + TS + Tailwind)
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Frontend
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tailwind v3
            </span>
          </div>
        </header>

        <main className="space-y-6">
          {/* Status Display */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-slate-200">System Integration Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>UI Components (@rydo/ui)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Shared Typings (@rydo/shared)</span>
              </div>
            </div>
          </div>

          {/* User List Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-200">Registered Users (Prisma + Neon)</h2>
              <Button variant="secondary" onClick={fetchUsers} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {error && (
              <div className="bg-amber-950/30 border border-amber-900/50 text-amber-300 rounded-lg p-3 text-xs">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors duration-200"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{user.name || 'Anonymous User'}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>ID: {user.id.substring(0, 8)}...</div>
                    <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {users.length === 0 && !loading && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No users found.
                </div>
              )}
            </div>
          </section>

          {/* UI Demo Buttons */}
          <section className="border-t border-slate-800 pt-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-200">UI Package Buttons</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="danger">Danger Action</Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
