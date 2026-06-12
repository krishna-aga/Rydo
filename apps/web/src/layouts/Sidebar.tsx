import { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-full lg:w-[450px] border-r border-slate-800 bg-slate-900/10 flex flex-col overflow-y-auto z-10 shrink-0">
      <div className="p-6 flex-1 flex flex-col gap-6">
        {children}
      </div>
    </aside>
  );
}
