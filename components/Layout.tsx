
import React from 'react';
import { Package2, UserCircle } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode; projectName?: string }> = ({ children, projectName }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500 rounded-lg text-slate-900 shadow-lg shadow-teal-500/20">
            <Package2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight">ProductPulse</h1>
            {projectName && <span className="text-[10px] text-teal-400 font-black tracking-widest uppercase mt-1 block">{projectName}</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-sm font-bold text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-widest">Docs</button>
          <div className="h-6 w-px bg-white/10"></div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/5 hover:border-teal-500/50 transition-all shadow-xl">
            <UserCircle className="w-5 h-5 text-teal-500" />
            <span className="text-xs font-black text-slate-200 uppercase tracking-widest">Executive</span>
          </button>
        </div>
      </nav>
      
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6">
        {children}
      </main>
      
      <footer className="py-8 border-t border-white/5 bg-slate-900/50 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; 2024 ProductPulse &bull; Synthetic Intelligence Framework &bull; Gemini Powered
      </footer>
    </div>
  );
};
