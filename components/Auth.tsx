
import React from 'react';
import { Lock, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onLogin: (user: string) => void;
}

export const Auth: React.FC<Props> = ({ onLogin }) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card rounded-[3.5rem] p-12 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Lock className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-3">Initialize Protocol</h2>
          <p className="text-slate-400 font-medium text-sm">Verify authorization for the command layer</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onLogin('admin@productpulse.ai')}
            className="w-full flex items-center justify-center gap-4 py-5 px-6 bg-slate-800 border-2 border-transparent hover:border-teal-500/50 hover:bg-slate-700/50 rounded-2xl transition-all group"
          >
            <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform">G</div>
            <span className="text-xs font-black text-slate-200 uppercase tracking-widest">Enterprise Google Auth</span>
          </button>

          <button
            onClick={() => onLogin('admin@productpulse.ai')}
            className="w-full flex items-center justify-center gap-4 py-5 px-6 bg-teal-500 border-2 border-teal-500 rounded-2xl hover:bg-teal-400 hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all group shadow-xl"
          >
            <Zap className="w-5 h-5 text-slate-900 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Direct Command SSO</span>
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 text-teal-500/60 mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quantum Security Enabled</span>
          </div>
          <p className="text-[9px] text-slate-500 font-bold px-8 leading-relaxed uppercase tracking-wider">
            Proprietary strategy data is encrypted using high-entropy key pairs.
          </p>
        </div>
      </div>
    </div>
  );
};
