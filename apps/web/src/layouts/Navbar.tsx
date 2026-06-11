import { useAuthStore } from '../store/useAuthStore.js';
import { Button } from '@rydo/ui';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex justify-between items-center relative z-20 shrink-0">
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
  );
}
