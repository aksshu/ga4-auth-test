
import React from 'react';
import { ProjectContext } from '../types';
import { Layout } from './Layout';
import { Briefcase, Plus, Calendar, ArrowRight, FolderOpen } from 'lucide-react';

interface Props {
  projects: ProjectContext[];
  onSelect: (project: ProjectContext) => void;
  onCreateNew: () => void;
}

export const ProjectSelector: React.FC<Props> = ({ projects, onSelect, onCreateNew }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Strategic Vault</h2>
          <p className="text-slate-400 font-medium mt-3 text-lg">Select a live environment or synthesize a new context.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-3 px-10 py-5 bg-teal-500 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20"
        >
          <Plus className="w-5 h-5" /> Initialize New Module
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {projects.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(p)}
            className="text-left glass-card p-10 rounded-[3.5rem] border-2 border-white/5 shadow-lg hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] hover:border-teal-500/30 hover:-translate-y-2 transition-all group flex flex-col h-full relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
               <FolderOpen className="w-32 h-32 -rotate-12" />
            </div>
            
            <div className="flex items-center justify-between mb-10">
              <div className="p-4 bg-slate-800 text-teal-400 rounded-2xl group-hover:bg-teal-500 group-hover:text-slate-900 transition-all shadow-2xl border border-white/5">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-500/20">
                Encrypted
              </div>
            </div>

            <div className="flex-1 relative z-10">
              <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] mb-3 block">{p.type} Module</span>
              <h3 className="text-3xl font-black text-white leading-tight mb-4 group-hover:text-teal-400 transition-colors tracking-tight">{p.name}</h3>
              <p className="text-slate-400 font-semibold text-sm line-clamp-3 leading-relaxed mb-8">{p.description}</p>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-teal-500 transition-colors">Access Architecture</span>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-2 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
