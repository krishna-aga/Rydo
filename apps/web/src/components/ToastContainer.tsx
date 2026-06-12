import { useSocketStore } from '../store/useSocketStore.js';

export default function ToastContainer() {
  const { toasts, removeToast } = useSocketStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = 'bg-slate-900 border-slate-800';
        let icon = '🔔';
        let textClass = 'text-indigo-400';

        if (toast.type === 'success') {
          bgClass = 'bg-slate-900 border-emerald-500/30 shadow-emerald-950/20';
          icon = '🎉';
          textClass = 'text-emerald-400';
        } else if (toast.type === 'warning') {
          bgClass = 'bg-slate-900 border-amber-500/30 shadow-amber-950/20';
          icon = '⚠️';
          textClass = 'text-amber-400';
        } else if (toast.type === 'error') {
          bgClass = 'bg-slate-900 border-rose-500/30 shadow-rose-950/20';
          icon = '❌';
          textClass = 'text-rose-400';
        } else {
          bgClass = 'bg-slate-900 border-indigo-500/30 shadow-indigo-950/20';
          icon = '🗺️';
          textClass = 'text-indigo-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl ${bgClass} transition-all duration-300 transform translate-y-0 scale-100 animate-slideInRight`}
          >
            <span className={`text-xl flex-shrink-0 ${textClass}`}>{icon}</span>
            <div className="flex-1">
              <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-400 text-xs focus:outline-none flex-shrink-0 ml-1 p-0.5"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
