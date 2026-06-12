import { ReactNode } from 'react';
import Navbar from './Navbar.js';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden relative z-10">
        {children}
      </div>
    </div>
  );
}
