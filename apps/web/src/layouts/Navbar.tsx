import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { Button } from '@rydo/ui';

export default function Navbar() {
  const { user, logout, activeTab, setActiveTab } = useAuthStore();
  const { notifications, markAllAsRead, clearNotifications } = useSocketStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

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

      {/* Tab Selectors */}
      {user.role === 'ADMIN' ? (
        <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-4 py-2 rounded-xl">
          🛡️ Admin Console
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${
              activeTab === 'operations'
                ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${
              activeTab === 'analytics'
                ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Analytics
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl z-50 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Notifications</span>
                <div className="flex gap-2">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Mark all read
                      </button>
                      <span className="text-slate-800 text-[10px]">•</span>
                      <button
                        onClick={clearNotifications}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-400 transition-colors"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    let icon = '🔔';
                    let iconBg = 'bg-slate-950 border-slate-800';
                    
                    if (notif.type === 'success') {
                      icon = '🎉';
                      iconBg = 'bg-emerald-950/20 border-emerald-900/30';
                    } else if (notif.type === 'warning') {
                      icon = '⚠️';
                      iconBg = 'bg-amber-950/20 border-amber-900/30';
                    } else if (notif.type === 'error') {
                      icon = '❌';
                      iconBg = 'bg-rose-950/20 border-rose-900/30';
                    }

                    const formattedTime = new Date(notif.timestamp).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={notif.id}
                        className={`flex gap-3 p-2.5 rounded-xl border transition-all duration-200 relative ${
                          notif.read
                            ? 'border-slate-800/40 bg-slate-900/20'
                            : 'border-slate-800 bg-slate-950/50 shadow-inner'
                        }`}
                      >
                        {!notif.read && (
                          <span className="absolute top-3.5 right-3 h-2 w-2 rounded-full bg-indigo-500" />
                        )}
                        <div className={`h-8 w-8 flex-shrink-0 rounded-lg border flex items-center justify-center text-sm ${iconBg}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-xs leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-500 block mt-1 font-mono">{formattedTime}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
